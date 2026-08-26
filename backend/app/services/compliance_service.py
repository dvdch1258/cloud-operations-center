import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.security_alert import SecurityAlert
from app.models.user import User
from app.models.vulnerability import VulnerabilityScan


ACTIVE_ALERT_STATUSES = {
    "open",
    "acknowledged",
}

SCAN_MAX_AGE = timedelta(hours=24)


def _control(
    *,
    control_id: str,
    category: str,
    title: str,
    passed: bool,
    severity: str,
    evidence: str,
    recommendation: str,
) -> dict:
    return {
        "control_id": control_id,
        "category": category,
        "title": title,
        "status": "passed" if passed else "failed",
        "severity": severity,
        "evidence": evidence,
        "recommendation": recommendation,
    }


def _latest_scan(
    db: Session,
    component: str,
) -> VulnerabilityScan | None:
    return (
        db.query(VulnerabilityScan)
        .filter(
            VulnerabilityScan.component == component
        )
        .order_by(
            VulnerabilityScan.scanned_at.desc(),
            VulnerabilityScan.id.desc(),
        )
        .first()
    )


def evaluate_compliance(db: Session) -> dict:
    now = datetime.now(timezone.utc)

    controls = []

    jwt_secret = os.getenv(
        "JWT_SECRET_KEY",
        "",
    )

    jwt_ok = len(jwt_secret.strip()) >= 32

    controls.append(
        _control(
            control_id="AUTH-001",
            category="authentication",
            title="Secreto JWT configurado",
            passed=jwt_ok,
            severity="critical",
            evidence=(
                "JWT_SECRET_KEY está configurado "
                "con una longitud adecuada."
                if jwt_ok
                else
                "JWT_SECRET_KEY no está configurado "
                "o es demasiado corto."
            ),
            recommendation=(
                "Mantener el secreto fuera del código "
                "y gestionado mediante Kubernetes Secret."
            ),
        )
    )

    active_users = (
        db.query(User)
        .filter(User.is_active.is_(True))
        .count()
    )

    controls.append(
        _control(
            control_id="AUTH-002",
            category="authentication",
            title="Usuarios activos disponibles",
            passed=active_users > 0,
            severity="high",
            evidence=(
                f"{active_users} usuario(s) activo(s) "
                "registrado(s)."
            ),
            recommendation=(
                "Mantener al menos una cuenta activa "
                "y revisar periódicamente las cuentas."
            ),
        )
    )

    ingest_key = os.getenv(
        "VULNERABILITY_INGEST_API_KEY",
        "",
    )

    ingest_ok = len(ingest_key.strip()) >= 32

    controls.append(
        _control(
            control_id="SECR-001",
            category="secrets",
            title="Ingestión de vulnerabilidades protegida",
            passed=ingest_ok,
            severity="critical",
            evidence=(
                "La API interna de ingestión dispone "
                "de una clave configurada."
                if ingest_ok
                else
                "No se detecta una clave válida para "
                "la ingestión de vulnerabilidades."
            ),
            recommendation=(
                "Mantener la clave en Kubernetes Secret "
                "y rotarla periódicamente."
            ),
        )
    )

    for component, control_id in (
        ("backend", "VULN-001"),
        ("frontend", "VULN-002"),
    ):
        scan = _latest_scan(
            db,
            component,
        )

        if scan is None:
            scan_ok = False
            evidence = (
                f"No existe ningún scan de {component}."
            )
        else:
            age = now - scan.scanned_at
            scan_ok = age <= SCAN_MAX_AGE

            age_hours = max(
                0,
                age.total_seconds() / 3600,
            )

            evidence = (
                f"Último scan de {component}: "
                f"{scan.image_tag}, hace "
                f"{age_hours:.1f} h."
            )

        controls.append(
            _control(
                control_id=control_id,
                category="vulnerabilities",
                title=(
                    f"Scan reciente de {component}"
                ),
                passed=scan_ok,
                severity="high",
                evidence=evidence,
                recommendation=(
                    "Mantener un análisis Trivy "
                    "automático con antigüedad "
                    "inferior a 24 horas."
                ),
            )
        )

    critical_active = (
        db.query(SecurityAlert)
        .filter(
            SecurityAlert.severity == "CRITICAL",
            SecurityAlert.status.in_(
                ACTIVE_ALERT_STATUSES
            ),
        )
        .count()
    )

    controls.append(
        _control(
            control_id="VULN-003",
            category="vulnerabilities",
            title="Sin vulnerabilidades críticas activas",
            passed=critical_active == 0,
            severity="critical",
            evidence=(
                f"{critical_active} alerta(s) "
                "CRITICAL activa(s)."
            ),
            recommendation=(
                "Priorizar la corrección de todas las "
                "vulnerabilidades críticas."
            ),
        )
    )

    high_active = (
        db.query(SecurityAlert)
        .filter(
            SecurityAlert.severity == "HIGH",
            SecurityAlert.status.in_(
                ACTIVE_ALERT_STATUSES
            ),
        )
        .count()
    )

    controls.append(
        _control(
            control_id="VULN-004",
            category="vulnerabilities",
            title="Sin vulnerabilidades altas activas",
            passed=high_active == 0,
            severity="high",
            evidence=(
                f"{high_active} alerta(s) "
                "HIGH activa(s)."
            ),
            recommendation=(
                "Planificar y aplicar las correcciones "
                "disponibles para vulnerabilidades HIGH."
            ),
        )
    )

    passed = sum(
        1
        for item in controls
        if item["status"] == "passed"
    )

    failed = len(controls) - passed

    score = round(
        passed / len(controls) * 100
    ) if controls else 100

    return {
        "score": score,
        "passed": passed,
        "failed": failed,
        "total": len(controls),
        "evaluated_at": now,
        "controls": controls,
    }
