import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.service import Service
from app.schemas.service import (
    ServiceCreate,
    ServiceResponse,
    ServiceUpdate,
)
from app.services.service_checker import check_all_services

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=list[ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    logger.info("services_list_requested")
    return db.query(Service).all()


# Debe declararse antes de /{service_id}.
@router.post("/check-all")
def run_services_check(db: Session = Depends(get_db)):
    logger.info("services_check_all_requested")

    result = check_all_services(db)

    logger.info(
        "services_check_all_completed",
        extra={
            "services_checked": result["services_checked"],
            "services_up": result["services_up"],
            "services_down": result["services_down"],
            "incidents_created": result["incidents_created"],
            "incidents_resolved": result["incidents_resolved"],
        },
    )

    return result


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        logger.warning(
            "service_not_found",
            extra={"service_id": service_id},
        )
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    logger.info(
        "service_detail_requested",
        extra={"service_id": service.id},
    )

    return service


@router.post("/", response_model=ServiceResponse)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
):
    new_service = Service(
        name=service.name,
        type=service.type,
        endpoint=service.endpoint,
        status="unknown",
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    logger.info(
        "service_created",
        extra={
            "service_id": new_service.id,
            "service_name": new_service.name,
            "service_type": new_service.type,
        },
    )

    return new_service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: Session = Depends(get_db),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        logger.warning(
            "service_update_not_found",
            extra={"service_id": service_id},
        )
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    service.name = service_update.name
    service.type = service_update.type
    service.endpoint = service_update.endpoint
    service.status = service_update.status

    db.commit()
    db.refresh(service)

    logger.info(
        "service_updated",
        extra={
            "service_id": service.id,
            "service_name": service.name,
            "service_status": service.status,
        },
    )

    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        logger.warning(
            "service_delete_not_found",
            extra={"service_id": service_id},
        )
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    db.delete(service)
    db.commit()

    logger.info(
        "service_deleted",
        extra={"service_id": service_id},
    )

    return {"message": "Service deleted successfully"}
