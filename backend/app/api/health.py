import logging

from datetime import datetime, timezone

from fastapi import APIRouter

from app.services.health_service import (
    check_database,
    check_prometheus,
    check_tempo
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    logger.info("health_check_requested")
    return {
        "status": "ok"
    }


@router.get("/health/detailed")
def detailed_health():
    database_status = check_database()
    prometheus_status = check_prometheus()
    tempo_status = check_tempo()

    overall_status = "ok"

    if (
        database_status == "down"
        or prometheus_status == "down"
        or tempo_status == "down"
    ):
        overall_status = "degraded"

    logger.info(
        "detailed_health_check_requested",
        extra={
            "status": overall_status,
            "database": database_status,
            "prometheus": prometheus_status,
            "tempo": tempo_status
        }
    )

    return {
        "status": overall_status,
        "database": database_status,
        "prometheus": prometheus_status,
        "tempo": tempo_status,
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
