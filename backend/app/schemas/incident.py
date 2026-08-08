from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IncidentBase(BaseModel):
    title: str
    description: str
    severity: str
    service_id: int


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(IncidentBase):
    status: str


class IncidentResponse(IncidentBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime | None
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
