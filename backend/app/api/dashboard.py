import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.incident import Incident
from app.models.service import Service
from app.schemas.dashboard import DashboardSummary

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    services_total = db.query(Service).count()

    services_up = (
        db.query(Service)
        .filter(Service.status == "up")
        .count()
    )

    services_down = (
        db.query(Service)
        .filter(Service.status == "down")
        .count()
    )

    incidents_open = (
        db.query(Incident)
        .filter(Incident.status == "open")
        .count()
    )

    logger.info(
        "dashboard_summary_requested",
        extra={
            "services_total": services_total,
            "services_up": services_up,
            "services_down": services_down,
            "incidents_open": incidents_open
        }
    )

    return {
        "services_total": services_total,
        "services_up": services_up,
        "services_down": services_down,
        "incidents_open": incidents_open
    }
