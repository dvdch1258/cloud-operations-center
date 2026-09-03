"""Append events to the caller's transaction; never commit independently."""
import logging
from datetime import datetime, timezone

from opentelemetry import trace
from sqlalchemy.orm import Session

from app.models.incident_event import IncidentEvent

logger = logging.getLogger(__name__)
INCIDENT_FIELDS = ("title", "description", "severity", "status", "service_id")


def incident_snapshot(incident) -> dict:
    return {field: getattr(incident, field) for field in INCIDENT_FIELDS}


def record_incident_event(
    db: Session, incident, *, event_type: str, source: str, summary: str,
    actor=None, changes: dict | None = None, execution=None,
) -> IncidentEvent:
    # Assign IDs without committing: incident and event succeed or roll back together.
    db.flush()
    context = trace.get_current_span().get_span_context()
    event = IncidentEvent(
        incident_id=incident.id,
        event_type=event_type,
        source=source,
        actor_user_id=actor.id if actor else None,
        actor_username=actor.username if actor else None,
        summary=summary[:300],
        changes=changes,
        trace_id=f"{context.trace_id:032x}" if context.is_valid else None,
        automation_execution_id=execution.id if execution else None,
        occurred_at=datetime.now(timezone.utc),
    )
    db.add(event)
    # The existing text formatter omits LogRecord.extra. Emit correlation IDs explicitly.
    logger.info(
        "incident_event_recorded incident_id=%s event_type=%s source=%s automation_execution_id=%s",
        incident.id, event_type, source, execution.id if execution else "none",
    )
    return event


def record_incident_changes(db: Session, incident, before: dict, *, source: str, actor=None):
    changes = {
        field: {"before": old, "after": getattr(incident, field)}
        for field, old in before.items() if old != getattr(incident, field)
    }
    if not changes:
        return None
    status_change = changes.get("status")
    return record_incident_event(
        db, incident,
        event_type="status_changed" if status_change else "updated",
        source=source,
        actor=actor,
        summary=(
            f"Estado: {status_change['before']} → {status_change['after']}"
            if status_change else "Incidente actualizado"
        ),
        changes=changes,
    )


def record_automation_event(db: Session, execution) -> None:
    if execution.incident_id is None:
        return
    from app.models.incident import Incident

    incident = db.get(Incident, execution.incident_id)
    if incident is None:
        return
    event_type = {
        "running": "automation_started", "skipped": "automation_skipped",
    }.get(execution.status, "automation_finished")
    record_incident_event(
        db, incident, event_type=event_type, source="automation", execution=execution,
        summary=f"{execution.rule_name}: {execution.status}",
        changes={"execution_status": execution.status, "rule_id": execution.rule_id},
    )
