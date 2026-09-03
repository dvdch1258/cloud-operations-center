from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


AutomationTriggerType = Literal[
    "service_down",
    "service_recovered",
]

AutomationActionType = Literal[
    "notify_webhook",
]

AutomationExecutionSource = Literal[
    "trigger",
    "manual_test",
]


class AutomationRuleCreate(BaseModel):
    name: str
    description: str | None = None
    enabled: bool = True

    trigger_type: AutomationTriggerType
    action_type: AutomationActionType

    service_id: int | None = None

    cooldown_seconds: int = Field(
        default=300,
        ge=0,
        le=86400,
    )


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None

    service_id: int | None = None

    cooldown_seconds: int | None = Field(
        default=None,
        ge=0,
        le=86400,
    )


class AutomationRuleTestRequest(BaseModel):
    service_id: int | None = None


class AutomationRuleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    enabled: bool

    trigger_type: str
    action_type: str

    service_id: int | None
    cooldown_seconds: int

    created_by_user_id: int | None
    created_by_username: str

    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )


class AutomationExecutionResponse(BaseModel):
    id: int
    incident_id: int | None = None

    rule_id: int | None
    rule_name: str

    trigger_type: str
    action_type: str

    service_id: int | None

    status: str
    execution_source: str

    trigger_payload: dict[str, Any] | None

    started_at: datetime
    finished_at: datetime | None
    duration_ms: float | None

    result: dict[str, Any] | None
    error: str | None

    model_config = ConfigDict(
        from_attributes=True
    )
