from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.observability import (
    ObservabilityLogsResponse,
    ObservabilityServicesSummaryResponse,
    ObservabilitySummaryResponse,
    ObservabilityTimeseriesResponse,
)
from app.services.observability_service import get_observability_services
from app.services.loki_service import (
    LokiQueryError,
    get_observability_logs,
)
from app.services.prometheus_service import (
    PrometheusQueryError,
    get_observability_summary,
    get_observability_timeseries,
)


router = APIRouter(
    prefix="/observability",
    tags=["observability"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/summary",
    response_model=ObservabilitySummaryResponse,
)
def get_summary():
    try:
        return get_observability_summary()
    except PrometheusQueryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Prometheus no disponible",
        ) from exc



@router.get(
    "/timeseries",
    response_model=ObservabilityTimeseriesResponse,
)
def get_timeseries():
    try:
        return get_observability_timeseries()
    except PrometheusQueryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Prometheus no disponible",
        ) from exc



@router.get(
    "/services",
    response_model=ObservabilityServicesSummaryResponse,
)
def get_services_observability(
    hours: int = Query(
        default=24,
        ge=1,
        le=720,
    ),
    db: Session = Depends(get_db),
):
    return get_observability_services(
        db,
        hours,
    )

@router.get(
    "/logs",
    response_model=ObservabilityLogsResponse,
)
def get_logs(
    hours: int = Query(
        default=1,
        ge=1,
        le=168,
    ),
    service: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    level: str | None = Query(
        default=None,
        pattern=(
            "^(debug|info|warning|error|critical)$"
        ),
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=200,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
):
    try:
        return get_observability_logs(
            hours=hours,
            service=service,
            level=level,
            search=search,
            limit=limit,
        )
    except LokiQueryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Loki no disponible",
        ) from exc
