import logging
import time
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.operation_execution import OperationExecution
from app.models.user import User
from app.services.service_checker import check_all_services


logger = logging.getLogger(__name__)


class OperationExecutionError(RuntimeError):
    pass


def execute_service_health_check(
    db: Session,
    user: User,
) -> OperationExecution:
    execution = OperationExecution(
        operation="service_health_check",
        status="running",
        requested_by_user_id=user.id,
        requested_by_username=user.username,
        started_at=datetime.now(timezone.utc),
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    started = time.perf_counter()

    logger.info(
        "operation_service_health_check_started",
        extra={
            "operation_execution_id": execution.id,
            "requested_by_user_id": user.id,
            "requested_by_username": user.username,
        },
    )

    try:
        result = check_all_services(db)

    except Exception as exc:
        duration_ms = (
            time.perf_counter() - started
        ) * 1000

        execution.status = "failed"
        execution.finished_at = datetime.now(
            timezone.utc
        )
        execution.duration_ms = round(
            duration_ms,
            3,
        )
        execution.error = str(exc)[:2000]

        db.add(execution)
        db.commit()
        db.refresh(execution)

        logger.exception(
            "operation_service_health_check_failed",
            extra={
                "operation_execution_id": execution.id,
                "requested_by_user_id": user.id,
            },
        )

        raise OperationExecutionError(
            "No se pudo completar la "
            "comprobación de servicios"
        ) from exc

    duration_ms = (
        time.perf_counter() - started
    ) * 1000

    execution.status = "success"
    execution.finished_at = datetime.now(
        timezone.utc
    )
    execution.duration_ms = round(
        duration_ms,
        3,
    )
    execution.result = result
    execution.error = None

    db.add(execution)
    db.commit()
    db.refresh(execution)

    logger.info(
        "operation_service_health_check_completed",
        extra={
            "operation_execution_id": execution.id,
            "requested_by_user_id": user.id,
            "services_checked": result["services_checked"],
            "services_up": result["services_up"],
            "services_down": result["services_down"],
        },
    )

    return execution


def get_operation_executions(
    db: Session,
    *,
    limit: int = 50,
) -> list[OperationExecution]:
    return (
        db.query(OperationExecution)
        .order_by(
            OperationExecution.started_at.desc()
        )
        .limit(limit)
        .all()
    )
