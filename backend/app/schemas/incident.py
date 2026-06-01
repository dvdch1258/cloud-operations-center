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

    model_config = ConfigDict(from_attributes=True)
