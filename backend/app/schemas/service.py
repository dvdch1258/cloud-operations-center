from pydantic import BaseModel, ConfigDict


class ServiceBase(BaseModel):
    name: str
    observability_name: str | None = None
    type: str
    endpoint: str


class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(ServiceBase):
    status: str

class ServiceResponse(ServiceBase):
    id: int
    status: str

    model_config = ConfigDict(from_attributes=True)
