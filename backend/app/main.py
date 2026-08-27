import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry import trace

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router
from app.api.observability import router as observability_router
from app.api.security import router as security_router
from app.api.vulnerability_ingest import router as vulnerability_ingest_router
from app.api.incidents import (
    internal_router as incidents_internal_router,
    router as incidents_router,
)
from app.services.metrics_service import update_business_metrics
from app.api.services import (
    internal_router as services_internal_router,
    router as services_router,
)
from app.core.config import settings
from app.core.telemetry import setup_telemetry
from app.core.logging_config import configure_logging

configure_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.version
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_logger = logging.getLogger("app.requests")


@app.middleware("http")
async def trace_logging_middleware(request: Request, call_next):
    response = await call_next(request)

    span_context = trace.get_current_span().get_span_context()

    if span_context.is_valid:
        trace_id = f"{span_context.trace_id:032x}"
        span_id = f"{span_context.span_id:016x}"
    else:
        trace_id = "0" * 32
        span_id = "0" * 16

    request_logger.info(
        "http_request method=%s path=%s status_code=%s "
        "trace_id=%s span_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        trace_id,
        span_id,
    )

    if span_context.is_valid:
        response.headers["X-Trace-ID"] = trace_id

    return response


# OpenTelemetry must wrap the trace logging middleware
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
app.include_router(auth_router)
app.include_router(health_router)
app.include_router(services_internal_router)
app.include_router(incidents_internal_router)
app.include_router(services_router)
app.include_router(incidents_router)
app.include_router(security_router)
app.include_router(observability_router)
app.include_router(vulnerability_ingest_router)
app.include_router(dashboard_router)
