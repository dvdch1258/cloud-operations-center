import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.core.database import engine


def setup_telemetry(app):
    resource = Resource.create({
        "service.name": "cloud-operations-backend"
    })

    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)

    otlp_endpoint = os.getenv(
        "OTEL_EXPORTER_OTLP_ENDPOINT",
        "http://tempo:4317"
    )

    otlp_exporter = OTLPSpanExporter(
        endpoint=otlp_endpoint,
        insecure=True
    )

    provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(
        engine=engine
    )
