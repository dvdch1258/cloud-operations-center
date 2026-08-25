from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.security_event import SecurityEvent
from app.models.vulnerability import (
    VulnerabilityFinding,
    VulnerabilityScan,
)
from app.models.user import User
from app.schemas.security import (
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
