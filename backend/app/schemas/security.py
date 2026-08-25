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


class VulnerabilitySummaryResponse(BaseModel):
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    unknown: int
    fix_available: int
    components: int
    last_scanned_at: datetime | None


class VulnerabilityFindingResponse(BaseModel):
    id: int
    component: str
    image_tag: str
    vulnerability_id: str
    severity: str
    package_name: str
    installed_version: str | None
    fixed_version: str | None
    trivy_status: str | None
    target: str | None
    target_type: str | None
    title: str | None
    primary_url: str | None
    published_at: datetime | None
    last_modified_at: datetime | None
