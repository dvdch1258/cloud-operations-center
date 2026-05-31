from pydantic import BaseModel, Field


class ServiceBase(BaseModel):
    name: str = Field(example="Grafana")
    type: str = Field(example="dashboard")
    endpoint: str = Field(example="http://grafana.local")


class ServiceCreate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: int = Field(example=1)
    status: str = Field(example="up")
