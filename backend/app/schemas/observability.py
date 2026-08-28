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


class ObservabilityLogResponse(BaseModel):
    timestamp: datetime
    service: str
    namespace: str | None
    pod: str | None
    container: str | None
    level: str
    message: str
    trace_id: str | None
    span_id: str | None


class ObservabilityLogsResponse(BaseModel):
    period_hours: int
    service: str | None
    level: str | None
    search: str | None
    limit: int
    total: int
    logs: list[ObservabilityLogResponse]


class ObservabilityTraceSummaryResponse(BaseModel):
    trace_id: str
    service: str
    operation: str
    started_at: datetime | None
    duration_ms: float


class ObservabilityTracesResponse(BaseModel):
    period_hours: int
    total: int
    traces: list[
        ObservabilityTraceSummaryResponse
    ]


class ObservabilitySpanResponse(BaseModel):
    span_id: str | None
    parent_span_id: str | None
    service: str
    name: str
    kind: str
    started_at: datetime | None
    duration_ms: float
    status: str
    http_method: str | None
    http_target: str | None
    http_status_code: int | str | None


class ObservabilityTraceDetailResponse(BaseModel):
    trace_id: str
    service: str
    operation: str
    started_at: datetime
    duration_ms: float
    status: str
    spans_total: int
    spans: list[
        ObservabilitySpanResponse
    ]
