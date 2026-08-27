from app.core.config import settings
from app.core.policies import (
    AUTO_RESOLVE_VULNERABILITY_ALERTS,
    VULNERABILITY_ALERT_SEVERITIES,
    VULNERABILITY_SCAN_MAX_AGE_HOURS,
)


def _policy(
    *,
    policy_id: str,
    category: str,
    name: str,
    description: str,
    value,
    unit: str | None,
    source: str,
) -> dict:
    return {
        "policy_id": policy_id,
        "category": category,
        "name": name,
        "description": description,
        "enabled": True,
        "enforcement": "enforced",
        "value": value,
        "unit": unit,
        "source": source,
    }


def get_security_policies() -> dict:
    alert_threshold = (
        "HIGH+"
        if {
            "CRITICAL",
            "HIGH",
        }.issubset(VULNERABILITY_ALERT_SEVERITIES)
        else ", ".join(
            sorted(VULNERABILITY_ALERT_SEVERITIES)
        )
    )

    policies = [
        _policy(
            policy_id="POL-AUTH-001",
            category="authentication",
            name="Límite de intentos de acceso",
            description=(
                "Número máximo de intentos fallidos "
                "antes de bloquear temporalmente "
                "una cuenta."
            ),
            value=settings.login_max_attempts,
            unit="attempts",
            source="configuration",
        ),
        _policy(
            policy_id="POL-AUTH-002",
            category="authentication",
            name="Duración del bloqueo",
            description=(
                "Tiempo durante el que una cuenta "
                "permanece bloqueada tras superar "
                "el límite de intentos."
            ),
            value=settings.login_lock_minutes,
            unit="minutes",
            source="configuration",
        ),
        _policy(
            policy_id="POL-VULN-001",
            category="vulnerabilities",
            name="Umbral de alertas de vulnerabilidad",
            description=(
                "Severidades de Trivy que generan "
                "alertas operativas."
            ),
            value=alert_threshold,
            unit=None,
            source="application_policy",
        ),
        _policy(
            policy_id="POL-VULN-002",
            category="vulnerabilities",
            name="Resolución automática de alertas",
            description=(
                "Resuelve automáticamente una alerta "
                "cuando la vulnerabilidad deja de "
                "aparecer en el siguiente scan."
            ),
            value=AUTO_RESOLVE_VULNERABILITY_ALERTS,
            unit=None,
            source="application_policy",
        ),
        _policy(
            policy_id="POL-SCAN-001",
            category="scanning",
            name="Antigüedad máxima del scan",
            description=(
                "Tiempo máximo admitido para considerar "
                "reciente un análisis de vulnerabilidades."
            ),
            value=VULNERABILITY_SCAN_MAX_AGE_HOURS,
            unit="hours",
            source="application_policy",
        ),
    ]

    return {
        "total": len(policies),
        "enabled": sum(
            1
            for policy in policies
            if policy["enabled"]
        ),
        "enforced": sum(
            1
            for policy in policies
            if policy["enforcement"] == "enforced"
        ),
        "policies": policies,
    }
