from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.services import router as services_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.version
)

app.include_router(health_router)
app.include_router(services_router)
