from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.observability import (
    ObservabilityLogsResponse,
    ObservabilityServicesSummaryResponse,
    ObservabilitySummaryResponse,
    ObservabilityTimeseriesResponse,
    ObservabilityTraceDetailResponse,
    ObservabilityTracesResponse,
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
from app.services.tempo_service import (
    TempoQueryError,
    TempoTraceNotFound,
    get_observability_trace,
    get_observability_traces,
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
def get_timeseries(
    hours: int = Query(
        default=1,
        ge=1,
        le=168,
    ),
):
    try:
        return get_observability_timeseries(
            hours=hours
        )
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


@router.get(
    "/traces",
    response_model=ObservabilityTracesResponse,
)
def get_traces(
    hours: int = Query(
        default=1,
        ge=1,
        le=168,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    service: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
        pattern=r"^[A-Za-z0-9._-]+$",
    ),
):
    try:
        return get_observability_traces(
            hours=hours,
            limit=limit,
            service=service,
        )
    except TempoQueryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Tempo no disponible",
        ) from exc


@router.get(
    "/traces/{trace_id}",
    response_model=ObservabilityTraceDetailResponse,
)
def get_trace(
    trace_id: str = Path(
        ...,
        min_length=32,
        max_length=32,
        pattern=r"^[0-9a-fA-F]{32}$",
    ),
):
    try:
        return get_observability_trace(
            trace_id
        )
    except TempoTraceNotFound as exc:
        raise HTTPException(
            status_code=404,
            detail="Traza no encontrada",
        ) from exc
    except TempoQueryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Tempo no disponible",
        ) from exc
