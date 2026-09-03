import logging
import time
from datetime import datetime, timedelta, timezone

import requests
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.automation_execution import AutomationExecution
from app.models.automation_rule import AutomationRule
from app.models.service import Service
from app.models.incident import Incident
from app.services.incident_event_service import record_automation_event


logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT_SECONDS = 5


class AutomationActionError(RuntimeError):
    pass


def _execute_notify_webhook(
    rule: AutomationRule,
    service: Service,
    trigger_payload: dict,
    execution_source: str,
) -> dict:
    webhook_url = (
        settings.automation_webhook_url.strip()
    )

    if not webhook_url:
        raise AutomationActionError(
            "AUTOMATION_WEBHOOK_URL no está configurada"
        )

    payload = {
        "event": "automation_triggered",
        "rule": {
            "id": rule.id,
            "name": rule.name,
            "trigger_type": rule.trigger_type,
            "action_type": rule.action_type,
        },
        "service": {
            "id": service.id,
            "name": service.name,
            "endpoint": service.endpoint,
        },
        "trigger": trigger_payload,
        "execution_source": execution_source,
        "sent_at": (
            datetime.now(timezone.utc).isoformat()
        ),
    }

    try:
        response = requests.post(
            webhook_url,
            json=payload,
            timeout=WEBHOOK_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise AutomationActionError(
            f"No se pudo entregar el webhook: {exc}"
        ) from exc

    if not 200 <= response.status_code < 300:
        raise AutomationActionError(
            "El webhook respondió con HTTP "
            f"{response.status_code}"
        )

    return {
        "delivered": True,
        "status_code": response.status_code,
    }


def execute_automation_rule(
    db: Session,
    *,
    rule: AutomationRule,
    service: Service,
    trigger_payload: dict,
    execution_source: str = "trigger",
    incident_id: int | None = None,
) -> AutomationExecution:
    if execution_source != "trigger":
        incident_id = None
    _validate_incident_link(db, incident_id, service.id)
    execution = AutomationExecution(
        incident_id=incident_id,
        rule_id=rule.id,
        rule_name=rule.name,
        trigger_type=rule.trigger_type,
        action_type=rule.action_type,
        service_id=service.id,
        status="running",
        execution_source=execution_source,
        trigger_payload=trigger_payload,
        started_at=datetime.now(timezone.utc),
    )

    db.add(execution)
    record_automation_event(db, execution)
    db.commit()
    db.refresh(execution)

    started = time.perf_counter()

    logger.info(
        "automation_execution_started",
        extra={
            "automation_execution_id": execution.id,
            "automation_rule_id": rule.id,
            "automation_rule_name": rule.name,
            "trigger_type": rule.trigger_type,
            "action_type": rule.action_type,
            "service_id": service.id,
            "execution_source": execution_source,
        },
    )

    try:
        if rule.action_type == "notify_webhook":
            result = _execute_notify_webhook(
                rule,
                service,
                trigger_payload,
                execution_source,
            )
        else:
            raise AutomationActionError(
                "Tipo de acción no soportado: "
                f"{rule.action_type}"
            )

    except Exception as exc:
        duration_ms = (
            time.perf_counter() - started
        ) * 1000

        execution.status = "failed"
        execution.finished_at = (
            datetime.now(timezone.utc)
        )
        execution.duration_ms = round(
            duration_ms,
            3,
        )
        execution.result = None
        execution.error = str(exc)[:2000]

        db.add(execution)
        record_automation_event(db, execution)
        db.commit()
        db.refresh(execution)

        logger.exception(
            "automation_execution_failed",
            extra={
                "automation_execution_id":
                    execution.id,
                "automation_rule_id": rule.id,
                "service_id": service.id,
            },
        )

        return execution

    duration_ms = (
        time.perf_counter() - started
    ) * 1000

    execution.status = "success"
    execution.finished_at = (
        datetime.now(timezone.utc)
    )
    execution.duration_ms = round(
        duration_ms,
        3,
    )
    execution.result = result
    execution.error = None

    db.add(execution)
    record_automation_event(db, execution)
    db.commit()
    db.refresh(execution)

    logger.info(
        "automation_execution_completed",
        extra={
            "automation_execution_id":
                execution.id,
            "automation_rule_id": rule.id,
            "service_id": service.id,
            "duration_ms":
                execution.duration_ms,
        },
    )

    return execution


def _get_recent_trigger_execution(
    db: Session,
    *,
    rule: AutomationRule,
    service: Service,
) -> AutomationExecution | None:
    cooldown_seconds = int(
        rule.cooldown_seconds or 0
    )

    if cooldown_seconds <= 0:
        return None

    cutoff = (
        datetime.now(timezone.utc)
        - timedelta(seconds=cooldown_seconds)
    )

    return (
        db.query(AutomationExecution)
        .filter(
            AutomationExecution.rule_id
            == rule.id,
            AutomationExecution.service_id
            == service.id,
            AutomationExecution.execution_source
            == "trigger",
            AutomationExecution.status.in_(
                (
                    "running",
                    "success",
                    "failed",
                )
            ),
            AutomationExecution.started_at
            >= cutoff,
        )
        .order_by(
            AutomationExecution.started_at.desc(),
            AutomationExecution.id.desc(),
        )
        .first()
    )


def _record_cooldown_skip(
    db: Session,
    *,
    rule: AutomationRule,
    service: Service,
    trigger_payload: dict,
    recent_execution: AutomationExecution,
    incident_id: int | None = None,
) -> AutomationExecution:
    now = datetime.now(timezone.utc)

    execution = AutomationExecution(
        incident_id=incident_id,
        rule_id=rule.id,
        rule_name=rule.name,
        trigger_type=rule.trigger_type,
        action_type=rule.action_type,
        service_id=service.id,
        status="skipped",
        execution_source="trigger",
        trigger_payload=trigger_payload,
        started_at=now,
        finished_at=now,
        duration_ms=0.0,
        result={
            "skipped": True,
            "reason": "cooldown",
            "cooldown_seconds":
                rule.cooldown_seconds,
            "recent_execution_id":
                recent_execution.id,
        },
        error=None,
    )

    db.add(execution)
    record_automation_event(db, execution)
    db.commit()
    db.refresh(execution)

    logger.info(
        "automation_rule_cooldown_skipped",
        extra={
            "automation_rule_id": rule.id,
            "automation_execution_id":
                execution.id,
            "recent_execution_id":
                recent_execution.id,
            "service_id": service.id,
            "cooldown_seconds":
                rule.cooldown_seconds,
        },
    )

    return execution


def _validate_incident_link(db: Session, incident_id: int | None, service_id: int) -> None:
    if incident_id is None:
        return
    incident = db.get(Incident, incident_id)
    if incident is None or incident.service_id != service_id:
        raise ValueError("El incidente no pertenece al servicio del disparador")


def run_automation_trigger(
    db: Session,
    *,
    trigger_type: str,
    service: Service,
    trigger_payload: dict,
    incident_id: int | None = None,
) -> list[AutomationExecution]:
    _validate_incident_link(db, incident_id, service.id)
    if incident_id is not None:
        trigger_payload = {**trigger_payload, "incident_id": incident_id}
    rules = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.enabled.is_(True),
            AutomationRule.trigger_type
            == trigger_type,
            or_(
                AutomationRule.service_id.is_(None),
                AutomationRule.service_id
                == service.id,
            ),
        )
        .order_by(AutomationRule.id)
        .all()
    )

    logger.info(
        "automation_trigger_evaluated",
        extra={
            "trigger_type": trigger_type,
            "service_id": service.id,
            "matching_rules": len(rules),
        },
    )

    executions = []

    for rule in rules:
        recent_execution = (
            _get_recent_trigger_execution(
                db,
                rule=rule,
                service=service,
            )
        )

        if recent_execution is not None:
            executions.append(
                _record_cooldown_skip(
                    db,
                    rule=rule,
                    service=service,
                    trigger_payload=trigger_payload,
                    recent_execution=
                        recent_execution,
                    incident_id=incident_id,
                )
            )
            continue

        executions.append(
            execute_automation_rule(
                db,
                rule=rule,
                service=service,
                trigger_payload=trigger_payload,
                incident_id=incident_id,
            )
        )

    return executions
