from datetime import datetime

from pydantic import BaseModel


class ObservabilitySummaryResponse(BaseModel):
    status: str
    prometheus_status: str
    requests_per_second: float
    error_rate_percent: float
    latency_p95_ms: float
    backend_uptime_seconds: float
    evaluated_at: datetime


class ObservabilityPointResponse(BaseModel):
    timestamp: int
    value: float


class ObservabilityTimeseriesResponse(BaseModel):
    range_seconds: int
    step_seconds: int
    requests_per_second: list[
        ObservabilityPointResponse
    ]
    latency_p95_ms: list[
        ObservabilityPointResponse
    ]


class ObservabilityServiceResponse(BaseModel):
    id: int
    name: str
    type: str
    status: str
    uptime_percent: float | None
    average_response_time_ms: float | None
    last_response_time_ms: float | None
    last_status_code: int | None
    last_error: str | None
    last_checked_at: datetime | None
    checks_total: int


class ObservabilityServicesSummaryResponse(BaseModel):
    period_hours: int
    total: int
    up: int
    down: int
    unknown: int
    services: list[ObservabilityServiceResponse]
