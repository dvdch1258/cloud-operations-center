from fastapi import APIRouter

from app.schemas.incident import IncidentCreate, IncidentResponse

router = APIRouter(prefix="/incidents", tags=["incidents"])

incidents_db = [
    {
        "id": 1,
        "title": "VPN Producción caída",
        "description": "El servicio no responde desde la red interna",
        "severity": "high",
        "status": "open",
        "service_id": 1
    }
]


@router.get("/", response_model=list[IncidentResponse])
def get_incidents():
    return incidents_db


@router.post("/", response_model=IncidentResponse)
def create_incident(incident: IncidentCreate):
    new_incident = {
        "id": len(incidents_db) + 1,
        "title": incident.title,
        "description": incident.description,
        "severity": incident.severity,
        "status": "open",
        "service_id": incident.service_id
    }

    incidents_db.append(new_incident)

    return new_incident
