from fastapi import APIRouter

from app.schemas.service import ServiceCreate, ServiceResponse

router = APIRouter(prefix="/services", tags=["services"])

services_db = [
    {
        "id": 1,
        "name": "VPN Producción",
        "type": "vpn",
        "endpoint": "10.0.0.1",
        "status": "up"
    }
]


@router.get("/", response_model=list[ServiceResponse])
def get_services():
    return services_db


@router.post("/", response_model=ServiceResponse)
def create_service(service: ServiceCreate):
    new_service = {
        "id": len(services_db) + 1,
        "name": service.name,
        "type": service.type,
        "endpoint": service.endpoint,
        "status": "unknown"
    }

    services_db.append(new_service)

    return new_service
