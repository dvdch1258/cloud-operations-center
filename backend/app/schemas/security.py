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


class SecurityAlertSummaryResponse(BaseModel):
    total: int
    open: int
    acknowledged: int
    resolved: int
    critical_active: int
    high_active: int
    last_seen_at: datetime | None


class SecurityAlertResponse(BaseModel):
    id: int
    alert_key: str
    source: str
    category: str
    severity: str
    status: str
    title: str
    description: str
    component: str | None
    vulnerability_id: str | None
    package_name: str | None
    finding_id: int | None
    first_seen_at: datetime
    last_seen_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecurityAlertSummaryResponse(BaseModel):
    total: int
    open: int
    acknowledged: int
    resolved: int
    critical_active: int
    high_active: int
    last_seen_at: datetime | None


class SecurityAlertResponse(BaseModel):
    id: int
    alert_key: str
    source: str
    category: str
    severity: str
    status: str
    title: str
    description: str
    component: str | None
    vulnerability_id: str | None
    package_name: str | None
    finding_id: int | None
    first_seen_at: datetime
    last_seen_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplianceControlResponse(BaseModel):
    control_id: str
    category: str
    title: str
    status: str
    severity: str
    evidence: str
    recommendation: str


class ComplianceSummaryResponse(BaseModel):
    score: int
    passed: int
    failed: int
    total: int
    evaluated_at: datetime
    controls: list[ComplianceControlResponse]


class SecurityPolicyResponse(BaseModel):
    policy_id: str
    category: str
    name: str
    description: str
    enabled: bool
    enforcement: str
    value: bool | int | str
    unit: str | None
    source: str


class SecurityPolicySummaryResponse(BaseModel):
    total: int
    enabled: int
    enforced: int
    policies: list[SecurityPolicyResponse]
