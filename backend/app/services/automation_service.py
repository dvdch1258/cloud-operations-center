import logging
import time
from datetime import datetime, timezone

import requests
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.automation_execution import AutomationExecution
from app.models.automation_rule import AutomationRule
from app.models.service import Service


logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT_SECONDS = 5


class AutomationActionError(RuntimeError):
    pass


def _execute_notify_webhook(
    rule: AutomationRule,
    service: Service,
    trigger_payload: dict,
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
) -> AutomationExecution:
    execution = AutomationExecution(
        rule_id=rule.id,
        rule_name=rule.name,
        trigger_type=rule.trigger_type,
        action_type=rule.action_type,
        service_id=service.id,
        status="running",
        trigger_payload=trigger_payload,
        started_at=datetime.now(timezone.utc),
    )

    db.add(execution)
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
        },
    )

    try:
        if rule.action_type == "notify_webhook":
            result = _execute_notify_webhook(
                rule,
                service,
                trigger_payload,
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


def run_automation_trigger(
    db: Session,
    *,
    trigger_type: str,
    service: Service,
    trigger_payload: dict,
) -> list[AutomationExecution]:
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
        executions.append(
            execute_automation_rule(
                db,
                rule=rule,
                service=service,
                trigger_payload=trigger_payload,
            )
        )

    return executions
