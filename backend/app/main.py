from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.incidents import router as incidents_router
from app.services.metrics_service import update_business_metrics
from app.api.services import router as services_router
from app.core.config import settings
from app.core.telemetry import setup_telemetry
from app.core.logging_config import setup_logging

app = FastAPI(
    title=settings.app_name,
    version=settings.version
)

# OpenTelemetry traces
setup_telemetry(app)

# Prometheus metrics
@app.middleware("http")
async def business_metrics_middleware(request, call_next):
    response = await call_next(request)

    excluded_paths = [
        "/health",
        "/health/detailed",
        "/metrics",
        "/docs",
        "/openapi.json"
    ]

    if request.url.path not in excluded_paths:
        try:
            update_business_metrics()
        except Exception:
            pass

    return response


Instrumentator().instrument(app).expose(app)

# Routers
app.include_router(health_router)
app.include_router(services_router)
app.include_router(incidents_router)
app.include_router(dashboard_router)
