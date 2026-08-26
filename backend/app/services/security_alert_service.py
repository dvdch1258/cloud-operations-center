from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.security_alert import SecurityAlert
from app.models.vulnerability import (
    VulnerabilityFinding,
    VulnerabilityScan,
)


ALERT_SEVERITIES = {
    "CRITICAL",
    "HIGH",
}


def build_vulnerability_alert_key(
    component: str,
    vulnerability_id: str,
    package_name: str,
) -> str:
    return (
        "trivy:vulnerability:"
        f"{component}:"
        f"{vulnerability_id}:"
        f"{package_name}"
    )


def sync_vulnerability_alerts(
    db: Session,
    *,
    scan: VulnerabilityScan,
    findings: list[VulnerabilityFinding],
) -> None:
    now = datetime.now(timezone.utc)

    active_keys: set[str] = set()

    for finding in findings:
        if finding.severity not in ALERT_SEVERITIES:
            continue

        alert_key = build_vulnerability_alert_key(
            scan.component,
            finding.vulnerability_id,
            finding.package_name,
        )

        active_keys.add(alert_key)

        alert = (
            db.query(SecurityAlert)
            .filter(
                SecurityAlert.alert_key == alert_key
            )
            .first()
        )

        title = (
            f"{finding.severity}: "
            f"{finding.vulnerability_id} "
            f"en {finding.package_name}"
        )

        description = (
            finding.title
            or finding.description
            or (
                f"Trivy detectó "
                f"{finding.vulnerability_id} "
                f"en el paquete "
                f"{finding.package_name}."
            )
        )

        if alert is None:
            alert = SecurityAlert(
                alert_key=alert_key,
                source="trivy",
                category="vulnerability",
                severity=finding.severity,
                status="open",
                title=title,
                description=description,
                component=scan.component,
                vulnerability_id=(
                    finding.vulnerability_id
                ),
                package_name=finding.package_name,
                finding_id=finding.id,
                first_seen_at=scan.scanned_at,
                last_seen_at=scan.scanned_at,
            )

            db.add(alert)
            continue

        alert.severity = finding.severity
        alert.title = title
        alert.description = description
        alert.finding_id = finding.id
        alert.last_seen_at = scan.scanned_at

        if alert.status == "resolved":
            alert.status = "open"
            alert.resolved_at = None
            alert.acknowledged_at = None

    active_alerts = (
        db.query(SecurityAlert)
        .filter(
            SecurityAlert.source == "trivy",
            SecurityAlert.category == "vulnerability",
            SecurityAlert.component == scan.component,
            SecurityAlert.status.in_(
                ["open", "acknowledged"]
            ),
        )
        .all()
    )

    for alert in active_alerts:
        if alert.alert_key in active_keys:
            continue

        alert.status = "resolved"
        alert.resolved_at = now
        alert.last_seen_at = scan.scanned_at
