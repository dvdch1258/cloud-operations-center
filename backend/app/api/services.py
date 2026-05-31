from fastapi import APIRouter

from app.schemas.service import ServiceResponse

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=list[ServiceResponse])
def get_services():
    return [
        {
            "id": 1,
            "name": "VPN Producción",
            "type": "vpn",
            "endpoint": "10.0.0.1",
            "status": "up"
        }
    ]
