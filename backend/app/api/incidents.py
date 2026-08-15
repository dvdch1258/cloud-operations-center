import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.incident import Incident
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/incidents",
    tags=["incidents"],
    dependencies=[Depends(get_current_user)],
)


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
    db: Session = Depends(get_db)
):
    new_incident = Incident(
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status="open",
        service_id=incident.service_id
    )

    db.add(new_incident)
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
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        logger.warning(
            "incident_update_not_found",
            extra={"incident_id": incident_id}
        )
        raise HTTPException(status_code=404, detail="Incident not found")

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
