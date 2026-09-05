import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    verify_n8n_api_key,
)
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.models.automation_execution import AutomationExecution
from app.models.service import Service
from app.models.user import User
from app.schemas.automation import AutomationExecutionResponse
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    IncidentDetailResponse, IncidentTimelineResponse, IncidentStatusUpdate,
    IncidentNoteCreate, IncidentEventResponse,
    IncidentCorrelationResponse,
)
from app.services.incident_event_service import (
    incident_snapshot, record_incident_event, record_incident_changes,
)
from app.services.incident_detail_service import (
    get_incident_detail, get_timeline, incident_window, incident_automations, get_captured_traces,
)
from app.services.loki_service import get_observability_logs, LokiQueryError
from app.services.tempo_service import get_observability_traces, TempoQueryError
from app.services.incident_correlation_service import get_incident_correlation

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/incidents",
    tags=["incidents"],
    dependencies=[Depends(get_current_user)],
)


internal_router = APIRouter(
    prefix="/internal",
    tags=["internal"],
)


@internal_router.get(
    "/incidents",
    response_model=list[IncidentResponse],
    dependencies=[Depends(verify_n8n_api_key)],
    include_in_schema=False,
)
def get_incidents_for_n8n(
    db: Session = Depends(get_db),
):
    logger.info("n8n_incidents_list_requested")
    return db.query(Incident).all()


@router.get("/", response_model=list[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    logger.info("incidents_list_requested")
    return db.query(Incident).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        logger.warning(
            "incident_not_found",
            extra={"incident_id": incident_id}
        )
        raise HTTPException(status_code=404, detail="Incident not found")

    logger.info(
        "incident_detail_requested",
        extra={"incident_id": incident.id}
    )

    return incident


@router.post("/", response_model=IncidentResponse)
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    _validate_service(db, incident.service_id)
    new_incident = Incident(
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status="open",
        service_id=incident.service_id
    )

    db.add(new_incident)
    record_incident_event(
        db, new_incident, event_type="created", source="user", actor=actor,
        summary="Incidente creado",
        changes={"status": {"before": None, "after": "open"}},
    )
    db.commit()
    db.refresh(new_incident)

    logger.info(
        "incident_created",
        extra={
            "incident_id": new_incident.id,
            "incident_title": new_incident.title,
            "incident_severity": new_incident.severity,
            "service_id": new_incident.service_id
        }
    )

    return new_incident


@router.delete("/{incident_id}")
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        logger.warning(
            "incident_delete_not_found",
            extra={"incident_id": incident_id}
        )
        raise HTTPException(status_code=404, detail="Incident not found")

    # Explicit cleanup also supports SQLite tests with FK enforcement disabled.
    db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident.id).delete(synchronize_session=False)
    db.query(AutomationExecution).filter(AutomationExecution.incident_id == incident.id).update(
        {AutomationExecution.incident_id: None}, synchronize_session=False
    )
    db.delete(incident)
    db.commit()

    logger.info(
        "incident_deleted",
        extra={"incident_id": incident_id}
    )

    return {"message": "Incident deleted successfully"}


@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident_update: IncidentUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).with_for_update().first()

    if not incident:
        logger.warning(
            "incident_update_not_found",
            extra={"incident_id": incident_id}
        )
        raise HTTPException(status_code=404, detail="Incident not found")

    _validate_service(db, incident_update.service_id)
    before = incident_snapshot(incident)
    incident.title = incident_update.title
    incident.description = incident_update.description
    incident.severity = incident_update.severity
    previous_status = incident.status

    incident.status = incident_update.status
    incident.service_id = incident_update.service_id

    if (
        incident.status in {"resolved", "closed"}
        and previous_status not in {"resolved", "closed"}
    ):
        incident.resolved_at = datetime.now(timezone.utc)

    elif incident.status in {"open", "investigating"}:
        incident.resolved_at = None

    record_incident_changes(db, incident, before, source="user", actor=actor)
    db.commit()
    db.refresh(incident)

    logger.info(
        "incident_updated",
        extra={
            "incident_id": incident.id,
            "incident_status": incident.status,
            "incident_severity": incident.severity,
            "service_id": incident.service_id
        }
    )

    return incident


def _require_incident(db: Session, incident_id: int, *, lock=False):
    query = db.query(Incident).filter(Incident.id == incident_id)
    if lock:
        query = query.with_for_update()
    incident = query.first()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


def _validate_service(db: Session, service_id: int | None):
    if service_id is not None and db.get(Service, service_id) is None:
        raise HTTPException(status_code=404, detail="Service not found")


@router.get("/{incident_id}/details", response_model=IncidentDetailResponse)
def get_details(incident_id: int, db: Session = Depends(get_db)):
    return get_incident_detail(db, _require_incident(db, incident_id))


@router.get("/{incident_id}/timeline", response_model=IncidentTimelineResponse)
def get_incident_timeline(
    incident_id: int, limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0), db: Session = Depends(get_db),
):
    _require_incident(db, incident_id)
    return get_timeline(db, incident_id, limit, offset)


@router.post("/{incident_id}/notes", response_model=IncidentEventResponse, status_code=201)
def add_incident_note(
    incident_id: int, note: IncidentNoteCreate, db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    incident = _require_incident(db, incident_id, lock=True)
    event = record_incident_event(
        db, incident, event_type="note_added", source="user", actor=actor,
        summary="Nota de investigación", changes={"text": note.text},
    )
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def change_incident_status(
    incident_id: int, update: IncidentStatusUpdate, db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    incident = _require_incident(db, incident_id, lock=True)
    before = incident_snapshot(incident)
    if incident.status != update.status:
        previous_status = incident.status
        incident.status = update.status
        if update.status in ("resolved", "closed") and previous_status not in ("resolved", "closed"):
            incident.resolved_at = datetime.now(timezone.utc)
        elif update.status in ("open", "investigating"):
            incident.resolved_at = None
        record_incident_changes(db, incident, before, source="user", actor=actor)
        db.commit()
        db.refresh(incident)
    return incident


@router.get("/{incident_id}/automations", response_model=list[AutomationExecutionResponse])
def get_related_automations(
    incident_id: int, limit: int = Query(25, ge=1, le=200), offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    _require_incident(db, incident_id)
    return incident_automations(db, incident_id).order_by(
        AutomationExecution.started_at.desc(), AutomationExecution.id.desc()
    ).offset(offset).limit(limit).all()


@router.get("/{incident_id}/logs")
def get_incident_logs(
    incident_id: int, service: str | None = Query(None, min_length=1, max_length=100),
    limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db),
):
    incident = _require_incident(db, incident_id)
    window = incident_window(incident)
    try:
        result = get_observability_logs(
            service=service, search=None if service else f"incident_id={incident_id} ",
            limit=limit, start_at=window["start_at"], end_at=window["end_at"],
        )
    except LokiQueryError as exc:
        raise HTTPException(status_code=503, detail="Loki no disponible") from exc
    return {**result, "window": window, "scope": "service" if service else "incident"}


@router.get("/{incident_id}/traces")
def get_incident_traces(
    incident_id: int,
    service: str | None = Query(None, min_length=1, max_length=100, pattern=r"^[A-Za-z0-9._-]+$"),
    limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db),
):
    incident = _require_incident(db, incident_id)
    window = incident_window(incident)
    if service is None:
        traces = get_captured_traces(db, incident_id, limit)
        return {"traces": traces, "total": len(traces), "scope": "incident", "window": window}
    try:
        result = get_observability_traces(
            service=service, limit=limit, start_at=window["start_at"], end_at=window["end_at"],
        )
    except TempoQueryError as exc:
        raise HTTPException(status_code=503, detail="Tempo no disponible") from exc
    return {**result, "window": window, "scope": "service"}


@router.get(
    "/{incident_id}/correlation",
    response_model=IncidentCorrelationResponse,
)
def get_correlation(
    incident_id: int,
    log_limit: int = Query(
        100,
        ge=1,
        le=500,
    ),
    trace_limit: int = Query(
        50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    incident = _require_incident(
        db,
        incident_id,
    )

    return get_incident_correlation(
        db,
        incident,
        log_limit=log_limit,
        trace_limit=trace_limit,
    )
