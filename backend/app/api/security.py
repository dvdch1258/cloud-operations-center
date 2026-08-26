from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.security_event import SecurityEvent
from app.models.security_alert import SecurityAlert
from app.models.vulnerability import (
    VulnerabilityFinding,
    VulnerabilityScan,
)
from app.models.user import User
from app.services.compliance_service import evaluate_compliance
from app.schemas.security import (
    ComplianceSummaryResponse,
    SecurityAlertResponse,
    SecurityAlertSummaryResponse,
    SecurityEventResponse,
    SecuritySummaryResponse,
    VulnerabilityFindingResponse,
    VulnerabilitySummaryResponse,
)


router = APIRouter(
    prefix="/security",
    tags=["security"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/events",
    response_model=list[SecurityEventResponse],
)
def get_security_events(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get(
    "/summary",
    response_model=SecuritySummaryResponse,
)
def get_security_summary(
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)

    events_last_24h = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.created_at >= since)
        .count()
    )

    failed_logins_last_24h = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "login_failed",
            SecurityEvent.created_at >= since,
        )
        .count()
    )

    lockouts_last_24h = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "account_locked",
            SecurityEvent.created_at >= since,
        )
        .count()
    )

    locked_users = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            User.locked_until.isnot(None),
            User.locked_until > now,
        )
        .count()
    )

    active_users = (
        db.query(User)
        .filter(User.is_active.is_(True))
        .count()
    )

    return SecuritySummaryResponse(
        events_last_24h=events_last_24h,
        failed_logins_last_24h=failed_logins_last_24h,
        lockouts_last_24h=lockouts_last_24h,
        locked_users=locked_users,
        active_users=active_users,
    )



VULNERABILITY_SEVERITIES = {
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
    "UNKNOWN",
}


def _get_latest_vulnerability_scans(
    db: Session,
    component: str | None = None,
) -> list[VulnerabilityScan]:
    if component:
        components = [component]
    else:
        components = [
            row[0]
            for row in (
                db.query(VulnerabilityScan.component)
                .distinct()
                .all()
            )
        ]

    scans = []

    for current_component in components:
        scan = (
            db.query(VulnerabilityScan)
            .filter(
                VulnerabilityScan.component
                == current_component
            )
            .order_by(
                VulnerabilityScan.scanned_at.desc(),
                VulnerabilityScan.id.desc(),
            )
            .first()
        )

        if scan is not None:
            scans.append(scan)

    return scans


@router.get(
    "/vulnerabilities/summary",
    response_model=VulnerabilitySummaryResponse,
)
def get_vulnerability_summary(
    db: Session = Depends(get_db),
):
    scans = _get_latest_vulnerability_scans(db)

    if not scans:
        return VulnerabilitySummaryResponse(
            total_findings=0,
            critical=0,
            high=0,
            medium=0,
            low=0,
            unknown=0,
            fix_available=0,
            components=0,
            last_scanned_at=None,
        )

    scan_ids = [scan.id for scan in scans]

    fix_available = (
        db.query(VulnerabilityFinding)
        .filter(
            VulnerabilityFinding.scan_id.in_(scan_ids),
            VulnerabilityFinding.fixed_version.isnot(None),
            VulnerabilityFinding.fixed_version != "",
        )
        .count()
    )

    return VulnerabilitySummaryResponse(
        total_findings=sum(scan.total for scan in scans),
        critical=sum(scan.critical for scan in scans),
        high=sum(scan.high for scan in scans),
        medium=sum(scan.medium for scan in scans),
        low=sum(scan.low for scan in scans),
        unknown=sum(scan.unknown for scan in scans),
        fix_available=fix_available,
        components=len(scans),
        last_scanned_at=max(
            scan.scanned_at for scan in scans
        ),
    )


@router.get(
    "/vulnerabilities",
    response_model=list[VulnerabilityFindingResponse],
)
def get_vulnerabilities(
    component: str | None = Query(
        default=None,
        min_length=1,
        max_length=50,
    ),
    severity: str | None = Query(
        default=None,
        min_length=1,
        max_length=20,
    ),
    fix_available: bool | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    normalized_severity = None

    if severity:
        normalized_severity = severity.upper()

        if normalized_severity not in VULNERABILITY_SEVERITIES:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Severidad inválida. Valores permitidos: "
                    "CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN"
                ),
            )

    scans = _get_latest_vulnerability_scans(
        db,
        component=component,
    )

    if not scans:
        return []

    scan_ids = [scan.id for scan in scans]

    query = (
        db.query(
            VulnerabilityFinding,
            VulnerabilityScan,
        )
        .join(
            VulnerabilityScan,
            VulnerabilityFinding.scan_id
            == VulnerabilityScan.id,
        )
        .filter(
            VulnerabilityFinding.scan_id.in_(scan_ids)
        )
    )

    if normalized_severity:
        query = query.filter(
            VulnerabilityFinding.severity
            == normalized_severity
        )

    if fix_available is True:
        query = query.filter(
            VulnerabilityFinding.fixed_version.isnot(None),
            VulnerabilityFinding.fixed_version != "",
        )

    elif fix_available is False:
        query = query.filter(
            (
                VulnerabilityFinding.fixed_version.is_(None)
            )
            | (
                VulnerabilityFinding.fixed_version == ""
            )
        )

    severity_order = {
        "CRITICAL": 1,
        "HIGH": 2,
        "MEDIUM": 3,
        "LOW": 4,
        "UNKNOWN": 5,
    }

    rows = query.all()

    rows.sort(
        key=lambda row: (
            severity_order.get(
                row[0].severity,
                99,
            ),
            row[0].vulnerability_id,
            row[0].package_name,
        )
    )

    response = []

    for finding, scan in rows[:limit]:
        response.append(
            VulnerabilityFindingResponse(
                id=finding.id,
                component=scan.component,
                image_tag=scan.image_tag,
                vulnerability_id=finding.vulnerability_id,
                severity=finding.severity,
                package_name=finding.package_name,
                installed_version=finding.installed_version,
                fixed_version=finding.fixed_version,
                trivy_status=finding.trivy_status,
                target=finding.target,
                target_type=finding.target_type,
                title=finding.title,
                primary_url=finding.primary_url,
                published_at=finding.published_at,
                last_modified_at=finding.last_modified_at,
            )
        )

    return response


ALERT_STATUSES = {
    "open",
    "acknowledged",
    "resolved",
}


@router.get(
    "/alerts/summary",
    response_model=SecurityAlertSummaryResponse,
)
def get_security_alert_summary(
    db: Session = Depends(get_db),
):
    active_statuses = ["open", "acknowledged"]

    total = db.query(SecurityAlert).count()

    open_count = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.status == "open")
        .count()
    )

    acknowledged = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.status == "acknowledged")
        .count()
    )

    resolved = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.status == "resolved")
        .count()
    )

    critical_active = (
        db.query(SecurityAlert)
        .filter(
            SecurityAlert.severity == "CRITICAL",
            SecurityAlert.status.in_(active_statuses),
        )
        .count()
    )

    high_active = (
        db.query(SecurityAlert)
        .filter(
            SecurityAlert.severity == "HIGH",
            SecurityAlert.status.in_(active_statuses),
        )
        .count()
    )

    latest = (
        db.query(SecurityAlert)
        .order_by(SecurityAlert.last_seen_at.desc())
        .first()
    )

    return SecurityAlertSummaryResponse(
        total=total,
        open=open_count,
        acknowledged=acknowledged,
        resolved=resolved,
        critical_active=critical_active,
        high_active=high_active,
        last_seen_at=(
            latest.last_seen_at if latest else None
        ),
    )


@router.get(
    "/alerts",
    response_model=list[SecurityAlertResponse],
)
def get_security_alerts(
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    component: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(SecurityAlert)

    if status:
        normalized_status = status.lower()

        if normalized_status not in ALERT_STATUSES:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Estado inválido. Valores permitidos: "
                    "open, acknowledged, resolved"
                ),
            )

        query = query.filter(
            SecurityAlert.status == normalized_status
        )

    if severity:
        normalized_severity = severity.upper()

        if normalized_severity not in VULNERABILITY_SEVERITIES:
            raise HTTPException(
                status_code=422,
                detail="Severidad inválida",
            )

        query = query.filter(
            SecurityAlert.severity == normalized_severity
        )

    if component:
        query = query.filter(
            SecurityAlert.component == component
        )

    severity_order = {
        "CRITICAL": 1,
        "HIGH": 2,
        "MEDIUM": 3,
        "LOW": 4,
        "UNKNOWN": 5,
    }

    alerts = query.all()

    alerts.sort(
        key=lambda alert: (
            severity_order.get(alert.severity, 99),
            -alert.last_seen_at.timestamp(),
        )
    )

    return alerts[:limit]


@router.patch(
    "/alerts/{alert_id}/acknowledge",
    response_model=SecurityAlertResponse,
)
def acknowledge_security_alert(
    alert_id: int,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.id == alert_id)
        .first()
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alerta no encontrada",
        )

    if alert.status == "resolved":
        raise HTTPException(
            status_code=409,
            detail="No se puede reconocer una alerta resuelta",
        )

    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(alert)

    return alert


@router.patch(
    "/alerts/{alert_id}/resolve",
    response_model=SecurityAlertResponse,
)
def resolve_security_alert(
    alert_id: int,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(SecurityAlert)
        .filter(SecurityAlert.id == alert_id)
        .first()
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Alerta no encontrada",
        )

    if alert.status != "resolved":
        alert.status = "resolved"
        alert.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(alert)

    return alert


@router.get(
    "/compliance/summary",
    response_model=ComplianceSummaryResponse,
)
def get_compliance_summary(
    db: Session = Depends(get_db),
):
    return evaluate_compliance(db)
