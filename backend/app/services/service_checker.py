import logging
import time
from datetime import datetime, timezone

import requests
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.service import Service
from app.models.service_check import ServiceCheck
from app.services.automation_service import run_automation_trigger
from app.services.incident_event_service import (
    incident_snapshot, record_incident_event, record_incident_changes,
)

logger = logging.getLogger(__name__)

ACTIVE_INCIDENT_STATUSES = ("open", "investigating")
AUTO_INCIDENT_PREFIX = "[AUTO]"
REQUEST_TIMEOUT_SECONDS = 5


def _find_active_auto_incident(
    db: Session,
    service_id: int,
) -> Incident | None:
    return (
        db.query(Incident)
        .filter(
            Incident.service_id == service_id,
            Incident.status.in_(ACTIVE_INCIDENT_STATUSES),
            Incident.title.startswith(AUTO_INCIDENT_PREFIX),
        )
        .order_by(Incident.id.desc())
        .first()
    )


def _check_endpoint(
    endpoint: str,
) -> tuple[str, int | None, float, str | None]:
    started_at = time.perf_counter()

    try:
        response = requests.get(
            endpoint,
            timeout=REQUEST_TIMEOUT_SECONDS,
            allow_redirects=True,
        )

        response_time_ms = round(
            (time.perf_counter() - started_at) * 1000,
            2,
        )

        # Consideramos operativo cualquier 2xx o 3xx.
        if 200 <= response.status_code < 400:
            return (
                "up",
                response.status_code,
                response_time_ms,
                None,
            )

        return (
            "down",
            response.status_code,
            response_time_ms,
            f"El endpoint respondió con HTTP {response.status_code}",
        )

    except requests.RequestException as exc:
        response_time_ms = round(
            (time.perf_counter() - started_at) * 1000,
            2,
        )

        return (
            "down",
            None,
            response_time_ms,
            str(exc),
        )


def check_all_services(db: Session) -> dict:
    services = db.query(Service).order_by(Service.id).all()

    results = []
    incidents_created = 0
    incidents_resolved = 0

    pending_automation_triggers = []

    for service in services:
        previous_status = service.status
        (
            new_status,
            status_code,
            response_time_ms,
            error,
        ) = _check_endpoint(service.endpoint)

        service.status = new_status
        active_incident = _find_active_auto_incident(db, service.id)
        related_incident = active_incident

        if new_status == "down" and active_incident is None:
            incident = Incident(
                title=f"{AUTO_INCIDENT_PREFIX} Caída de {service.name}",
                description=(
                    f"El comprobador automático no pudo validar "
                    f"el servicio '{service.name}'.\n"
                    f"Endpoint: {service.endpoint}\n"
                    f"Detalle: {error or 'Sin detalle adicional'}"
                ),
                severity="high",
                status="open",
                service_id=service.id,
            )

            db.add(incident)
            record_incident_event(
                db, incident, event_type="created", source="checker",
                summary="Incidente abierto por el comprobador de servicios",
                changes={"status": {"before": None, "after": "open"}},
            )
            related_incident = incident
            incidents_created += 1

            logger.warning(
                "automatic_incident_created",
                extra={
                    "service_id": service.id,
                    "service_name": service.name,
                    "endpoint": service.endpoint,
                    "error": error,
                },
            )

        elif new_status == "up" and active_incident is not None:
            before = incident_snapshot(active_incident)
            active_incident.status = "resolved"
            active_incident.resolved_at = datetime.now(timezone.utc)
            active_incident.description = (
                f"{active_incident.description}\n\n"
                f"Recuperado automáticamente: "
                f"{datetime.now(timezone.utc).isoformat()}"
            )

            record_incident_changes(db, active_incident, before, source="checker")
            incidents_resolved += 1

            logger.info(
                "automatic_incident_resolved",
                extra={
                    "incident_id": active_incident.id,
                    "service_id": service.id,
                    "service_name": service.name,
                },
            )

        service_check = ServiceCheck(
            service_id=service.id,
            status=new_status,
            status_code=status_code,
            response_time_ms=response_time_ms,
            error=error,
        )
        db.add(service_check)

        trigger_type = None

        if (
            new_status == "down"
            and previous_status != "down"
        ):
            trigger_type = "service_down"

        elif (
            new_status == "up"
            and previous_status == "down"
        ):
            trigger_type = "service_recovered"

        if trigger_type is not None:
            pending_automation_triggers.append(
                (
                    trigger_type,
                    service,
                    related_incident.id if related_incident else None,
                    {
                        "previous_status":
                            previous_status,
                        "status":
                            new_status,
                        "status_code":
                            status_code,
                        "response_time_ms":
                            response_time_ms,
                        "error":
                            error,
                    },
                )
            )

        results.append(
            {
                "service_id": service.id,
                "name": service.name,
                "endpoint": service.endpoint,
                "previous_status": previous_status,
                "status": new_status,
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "error": error,
            }
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("services_check_commit_failed")
        raise

    automation_executions = 0
    automation_failures = 0
    automation_errors = 0

    for (
        trigger_type,
        service,
        incident_id,
        trigger_payload,
    ) in pending_automation_triggers:
        try:
            executions = run_automation_trigger(
                db,
                trigger_type=trigger_type,
                service=service,
                trigger_payload=trigger_payload,
                incident_id=incident_id,
            )

            automation_executions += len(
                executions
            )

            automation_failures += sum(
                execution.status == "failed"
                for execution in executions
            )

        except Exception:
            db.rollback()
            automation_errors += 1

            logger.exception(
                "automation_trigger_failed",
                extra={
                    "trigger_type":
                        trigger_type,
                    "service_id":
                        service.id,
                },
            )

    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "services_checked": len(services),
        "services_up": sum(
            result["status"] == "up" for result in results
        ),
        "services_down": sum(
            result["status"] == "down" for result in results
        ),
        "incidents_created": incidents_created,
        "incidents_resolved": incidents_resolved,
        "automation_trigger_events": len(
            pending_automation_triggers
        ),
        "automation_executions":
            automation_executions,
        "automation_failures":
            automation_failures,
        "automation_errors":
            automation_errors,
        "results": results,
    }
