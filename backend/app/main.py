from fastapi import FastAPI

from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.incidents import router as incidents_router
from app.api.services import router as services_router
from app.core.config import settings
from app.core.database import Base, engine
from app.models import Service


app = FastAPI(
    title=settings.app_name,
    version=settings.version
)

app.include_router(health_router)
app.include_router(services_router)
app.include_router(incidents_router)
app.include_router(dashboard_router)
