from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ServiceCheckResponse(BaseModel):
    id: int
    service_id: int
    status: str
    status_code: int | None
    response_time_ms: float
    error: str | None
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceUptimeResponse(BaseModel):
    service_id: int
    service_name: str
    period_hours: int
    checks_total: int
    checks_up: int
    checks_down: int
    uptime_percent: float | None
    average_response_time_ms: float | None
    last_checked_at: datetime | None
