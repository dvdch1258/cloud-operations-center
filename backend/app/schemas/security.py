from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SecurityEventResponse(BaseModel):
    id: int
    event_type: str
    severity: str
    source: str
    user_id: int | None
    username: str | None
    ip_address: str | None
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecuritySummaryResponse(BaseModel):
    events_last_24h: int
    failed_logins_last_24h: int
    lockouts_last_24h: int
    locked_users: int
    active_users: int
