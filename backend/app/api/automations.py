import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.automation_execution import AutomationExecution
from app.models.automation_rule import AutomationRule
from app.models.service import Service
from app.models.user import User
from app.schemas.automation import (
    AutomationExecutionResponse,
    AutomationRuleCreate,
    AutomationRuleResponse,
    AutomationRuleTestRequest,
    AutomationRuleUpdate,
)
from app.services.automation_service import (
    execute_automation_rule,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/automations",
    tags=["automations"],
    dependencies=[Depends(get_current_user)],
)


def _get_rule_or_404(
    db: Session,
    rule_id: int,
) -> AutomationRule:
    rule = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.id == rule_id
        )
        .first()
    )

    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="Regla de automatización no encontrada",
        )

    return rule


def _validate_service(
    db: Session,
    service_id: int | None,
) -> None:
    if service_id is None:
        return

    exists = (
        db.query(Service.id)
        .filter(Service.id == service_id)
        .first()
    )

    if exists is None:
        raise HTTPException(
            status_code=422,
            detail="El servicio indicado no existe",
        )


@router.get(
    "/rules",
    response_model=list[AutomationRuleResponse],
)
def list_automation_rules(
    enabled: bool | None = Query(
        default=None,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_db),
):
    query = db.query(AutomationRule)

    if enabled is not None:
        query = query.filter(
            AutomationRule.enabled.is_(enabled)
        )

    return (
        query
        .order_by(
            AutomationRule.created_at.desc(),
            AutomationRule.id.desc(),
        )
        .limit(limit)
        .all()
    )


@router.post(
    "/rules",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_rule(
    payload: AutomationRuleCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    _validate_service(
        db,
        payload.service_id,
    )

    rule = AutomationRule(
        name=payload.name.strip(),
        description=payload.description,
        enabled=payload.enabled,
        trigger_type=payload.trigger_type,
        action_type=payload.action_type,
        service_id=payload.service_id,
        created_by_user_id=current_user.id,
        created_by_username=current_user.username,
    )

    if not rule.name:
        raise HTTPException(
            status_code=422,
            detail="El nombre no puede estar vacío",
        )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    logger.info(
        "automation_rule_created",
        extra={
            "automation_rule_id": rule.id,
            "trigger_type": rule.trigger_type,
            "action_type": rule.action_type,
            "service_id": rule.service_id,
            "created_by_user_id":
                current_user.id,
        },
    )

    return rule


@router.get(
    "/rules/{rule_id}",
    response_model=AutomationRuleResponse,
)
def get_automation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    return _get_rule_or_404(
        db,
        rule_id,
    )


@router.patch(
    "/rules/{rule_id}",
    response_model=AutomationRuleResponse,
)
def update_automation_rule(
    rule_id: int,
    payload: AutomationRuleUpdate,
    db: Session = Depends(get_db),
):
    rule = _get_rule_or_404(
        db,
        rule_id,
    )

    fields = payload.model_fields_set

    if "name" in fields:
        if payload.name is None:
            raise HTTPException(
                status_code=422,
                detail="El nombre no puede ser null",
            )

        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=422,
                detail="El nombre no puede estar vacío",
            )

        rule.name = name

    if "description" in fields:
        rule.description = payload.description

    if "enabled" in fields:
        if payload.enabled is None:
            raise HTTPException(
                status_code=422,
                detail="enabled no puede ser null",
            )

        rule.enabled = payload.enabled

    if "service_id" in fields:
        _validate_service(
            db,
            payload.service_id,
        )

        rule.service_id = payload.service_id

    db.add(rule)
    db.commit()
    db.refresh(rule)

    logger.info(
        "automation_rule_updated",
        extra={
            "automation_rule_id": rule.id,
            "enabled": rule.enabled,
            "service_id": rule.service_id,
        },
    )

    return rule


@router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_automation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    rule = _get_rule_or_404(
        db,
        rule_id,
    )

    logger.info(
        "automation_rule_deleted",
        extra={
            "automation_rule_id": rule.id,
            "automation_rule_name": rule.name,
        },
    )

    db.delete(rule)
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


@router.post(
    "/rules/{rule_id}/test",
    response_model=AutomationExecutionResponse,
)
def test_automation_rule(
    rule_id: int,
    payload: AutomationRuleTestRequest,
    db: Session = Depends(get_db),
):
    rule = _get_rule_or_404(
        db,
        rule_id,
    )

    if rule.service_id is not None:
        if (
            payload.service_id is not None
            and payload.service_id != rule.service_id
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "La regla está asociada a otro "
                    "servicio"
                ),
            )

        service_id = rule.service_id

    else:
        if payload.service_id is None:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Selecciona un servicio para probar "
                    "una regla global"
                ),
            )

        service_id = payload.service_id

    service = (
        db.query(Service)
        .filter(
            Service.id == service_id
        )
        .first()
    )

    if service is None:
        raise HTTPException(
            status_code=422,
            detail="El servicio indicado no existe",
        )

    execution = execute_automation_rule(
        db,
        rule=rule,
        service=service,
        trigger_payload={
            "manual_test": True,
            "configured_trigger_type":
                rule.trigger_type,
        },
        execution_source="manual_test",
    )

    logger.info(
        "automation_rule_tested",
        extra={
            "automation_rule_id": rule.id,
            "automation_execution_id":
                execution.id,
            "service_id": service.id,
            "execution_status":
                execution.status,
        },
    )

    return execution


@router.get(
    "/executions",
    response_model=list[AutomationExecutionResponse],
)
def list_automation_executions(
    rule_id: int | None = Query(
        default=None,
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_db),
):
    query = db.query(AutomationExecution)

    if rule_id is not None:
        query = query.filter(
            AutomationExecution.rule_id
            == rule_id
        )

    if status_filter:
        query = query.filter(
            AutomationExecution.status
            == status_filter
        )

    return (
        query
        .order_by(
            AutomationExecution.started_at.desc(),
            AutomationExecution.id.desc(),
        )
        .limit(limit)
        .all()
    )


@router.get(
    "/executions/{execution_id}",
    response_model=AutomationExecutionResponse,
)
def get_automation_execution(
    execution_id: int,
    db: Session = Depends(get_db),
):
    execution = (
        db.query(AutomationExecution)
        .filter(
            AutomationExecution.id
            == execution_id
        )
        .first()
    )

    if execution is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Ejecución de automatización "
                "no encontrada"
            ),
        )

    return execution
