from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.automation_execution import (
    AutomationExecution,
)
from app.models.automation_rule import (
    AutomationRule,
)
from app.models.service import Service
from app.models.user import User


def _seed_execution():
    db = SessionLocal()

    try:
        user = User(
            username="execution_detail_user",
            password_hash="unused-test-hash",
            is_active=True,
        )

        db.add(user)
        db.flush()

        service = Service(
            name="Execution Detail Service",
            type="api",
            endpoint="http://example.invalid",
            status="down",
        )

        db.add(service)
        db.flush()

        rule = AutomationRule(
            name="Execution Detail Rule",
            description="Detail API pytest",
            enabled=True,
            trigger_type="service_down",
            action_type="notify_webhook",
            service_id=service.id,
            cooldown_seconds=300,
            created_by_user_id=user.id,
            created_by_username=user.username,
        )

        db.add(rule)
        db.flush()

        now = datetime.now(timezone.utc)

        execution = AutomationExecution(
            rule_id=rule.id,
            rule_name=rule.name,
            trigger_type=rule.trigger_type,
            action_type=rule.action_type,
            service_id=service.id,
            status="skipped",
            execution_source="trigger",
            trigger_payload={
                "status": "down",
            },
            started_at=now,
            finished_at=now,
            duration_ms=0.0,
            result={
                "skipped": True,
                "reason": "cooldown",
                "cooldown_seconds": 300,
                "recent_execution_id": 123,
            },
            error=None,
        )

        db.add(execution)
        db.commit()

        db.refresh(user)
        db.refresh(execution)

        token = create_access_token(
            user_id=user.id,
            username=user.username,
        )

        return execution.id, token

    finally:
        db.close()


def _headers(token):
    return {
        "Authorization": f"Bearer {token}",
    }


def test_execution_detail_returns_full_execution(
    client,
):
    execution_id, token = _seed_execution()

    response = client.get(
        (
            "/automations/executions/"
            f"{execution_id}"
        ),
        headers=_headers(token),
    )

    assert response.status_code == 200

    body = response.json()

    assert body["id"] == execution_id
    assert body["status"] == "skipped"
    assert (
        body["execution_source"]
        == "trigger"
    )
    assert (
        body["result"]["reason"]
        == "cooldown"
    )
    assert (
        body["result"]["cooldown_seconds"]
        == 300
    )
    assert (
        body["result"]["recent_execution_id"]
        == 123
    )
    assert (
        body["trigger_payload"]["status"]
        == "down"
    )


def test_execution_detail_returns_404(
    client,
):
    _, token = _seed_execution()

    response = client.get(
        "/automations/executions/99999999",
        headers=_headers(token),
    )

    assert response.status_code == 404
    assert (
        response.json()["detail"]
        == (
            "Ejecución de automatización "
            "no encontrada"
        )
    )


def test_execution_detail_requires_authentication(
    client,
):
    execution_id, _ = _seed_execution()

    response = client.get(
        (
            "/automations/executions/"
            f"{execution_id}"
        )
    )

    assert response.status_code == 401
