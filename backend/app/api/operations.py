import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.operation import OperationExecutionResponse
from app.services.operations_service import (
    OperationExecutionError,
    execute_service_health_check,
    get_operation_executions,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/operations",
    tags=["operations"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/service-check",
    response_model=OperationExecutionResponse,
)
def run_service_health_check(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info(
        "operation_service_check_requested",
        extra={
            "requested_by_user_id": current_user.id,
            "requested_by_username": current_user.username,
        },
    )

    try:
        return execute_service_health_check(
            db,
            current_user,
        )

    except OperationExecutionError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


@router.get(
    "/executions",
    response_model=list[OperationExecutionResponse],
)
def list_operation_executions(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_db),
):
    return get_operation_executions(
        db,
        limit=limit,
    )
