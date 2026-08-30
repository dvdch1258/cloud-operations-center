from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


AutomationTriggerType = Literal[
    "service_down",
    "service_recovered",
]

AutomationActionType = Literal[
    "notify_webhook",
]


class AutomationRuleCreate(BaseModel):
    name: str
    description: str | None = None
    enabled: bool = True

    trigger_type: AutomationTriggerType
    action_type: AutomationActionType

    service_id: int | None = None


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None

    service_id: int | None = None


class AutomationRuleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    enabled: bool

    trigger_type: str
    action_type: str

    service_id: int | None

    created_by_user_id: int | None
    created_by_username: str

    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )


class AutomationExecutionResponse(BaseModel):
    id: int

    rule_id: int | None
    rule_name: str

    trigger_type: str
    action_type: str

    service_id: int | None

    status: str

    trigger_payload: dict[str, Any] | None

    started_at: datetime
    finished_at: datetime | None
    duration_ms: float | None

    result: dict[str, Any] | None
    error: str | None

    model_config = ConfigDict(
        from_attributes=True
    )
