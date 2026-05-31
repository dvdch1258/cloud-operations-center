from pydantic import BaseModel


class ServiceBase(BaseModel):
    name: str
    type: str
    endpoint: str


class ServiceCreate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: int
    status: str
