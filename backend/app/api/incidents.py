from fastapi import APIRouter

from app.schemas.incident import IncidentResponse

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("/", response_model=list[IncidentResponse])
def get_incidents():
    return [
        {
            "id": 1,
            "title": "VPN Producción caída",
            "description": "El servicio no responde desde la red interna",
            "severity": "high",
            "status": "open",
            "service_id": 1
        }
    ]
