from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.automation_execution import AutomationExecution
from app.models.incident_event import IncidentEvent
from app.models.service import Service


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def incident_window(incident) -> dict:
    now = datetime.now(timezone.utc)
    end = min(_utc(incident.resolved_at) + timedelta(minutes=5), now) if incident.resolved_at else now
    original_start = _utc(incident.created_at) - timedelta(minutes=5)
    start = max(original_start, end - timedelta(days=7))
    return {"start_at": start, "end_at": max(end, start), "truncated": start > original_start}


def get_timeline(db: Session, incident_id: int, limit=50, offset=0) -> dict:
    query = db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident_id)
    return {
        "total": query.count(), "limit": limit, "offset": offset,
        "events": query.order_by(IncidentEvent.occurred_at.desc(), IncidentEvent.id.desc())
        .offset(offset).limit(limit).all(),
    }


def incident_automations(db: Session, incident_id: int):
    # No inference based on service_id or timestamps: only persisted causal links.
    return db.query(AutomationExecution).filter(AutomationExecution.incident_id == incident_id)


def get_incident_detail(db: Session, incident) -> dict:
    automations = incident_automations(db, incident.id)
    return {
        "incident": incident,
        "service": db.get(Service, incident.service_id) if incident.service_id else None,
        "timeline": get_timeline(db, incident.id),
        "automations": automations.order_by(AutomationExecution.started_at.desc(), AutomationExecution.id.desc()).limit(25).all(),
        "automations_total": automations.count(),
        "window": incident_window(incident),
    }


def get_captured_traces(db: Session, incident_id: int, limit: int) -> list[dict]:
    from sqlalchemy import func

    rows = (
        db.query(IncidentEvent.trace_id, func.max(IncidentEvent.occurred_at).label("started_at"))
        .filter(IncidentEvent.incident_id == incident_id, IncidentEvent.trace_id.is_not(None))
        .group_by(IncidentEvent.trace_id)
        .order_by(func.max(IncidentEvent.occurred_at).desc(), IncidentEvent.trace_id)
        .limit(limit).all()
    )
    return [{"trace_id": row.trace_id, "started_at": row.started_at,
             "operation": "Traza capturada en un evento del incidente", "service": None,
             "duration_ms": None} for row in rows]
