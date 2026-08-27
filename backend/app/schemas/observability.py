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
