from pydantic import BaseModel


class IncidentBase(BaseModel):
    title: str
    description: str
    severity: str
    service_id: int


class IncidentCreate(IncidentBase):
    pass


class IncidentResponse(IncidentBase):
    id: int
    status: str
