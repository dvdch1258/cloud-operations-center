from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.schemas.observability import (
    ObservabilitySummaryResponse,
)
from app.services.prometheus_service import (
    PrometheusQueryError,
    get_observability_summary,
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
