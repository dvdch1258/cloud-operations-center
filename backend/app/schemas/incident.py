from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.automation import AutomationExecutionResponse
from app.schemas.service import ServiceResponse

IncidentStatus = Literal["open", "investigating", "resolved", "closed"]


class IncidentBase(BaseModel):
    title: str
    description: str
    severity: str
    service_id: int


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(IncidentBase):
    service_id: int | None
    status: IncidentStatus


class IncidentResponse(IncidentBase):
    service_id: int | None

    id: int
    status: str
    created_at: datetime
    updated_at: datetime | None
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class IncidentNoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=4000)

    @field_validator("text")
    @classmethod
    def nonempty_text(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("La nota no puede estar vacía")
        return value


class IncidentEventResponse(BaseModel):
    id: int
    incident_id: int
    event_type: str
    source: str
    actor_username: str | None
    summary: str
    changes: dict[str, Any] | None
    trace_id: str | None
    automation_execution_id: int | None
    occurred_at: datetime
    model_config = ConfigDict(from_attributes=True)


class IncidentTimelineResponse(BaseModel):
    total: int
    limit: int
    offset: int
    events: list[IncidentEventResponse]


class IncidentWindow(BaseModel):
    start_at: datetime
    end_at: datetime
    truncated: bool


class IncidentDetailResponse(BaseModel):
    incident: IncidentResponse
    service: ServiceResponse | None
    timeline: IncidentTimelineResponse
    automations: list[AutomationExecutionResponse]
    automations_total: int
    window: IncidentWindow
