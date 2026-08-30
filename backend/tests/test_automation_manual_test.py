from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.automation_execution import AutomationExecution
from app.models.automation_rule import AutomationRule
from app.models.service import Service
from app.models.user import User
from app.services import automation_service


class FakeWebhookResponse:
    status_code = 200


def _seed_rule(
    *,
    username: str,
    global_rule: bool = False,
    enabled: bool = True,
):
    db = SessionLocal()

    try:
        user = User(
            username=username,
            password_hash="unused-test-hash",
            is_active=True,
        )

        db.add(user)
        db.flush()

        service = Service(
            name=f"Service {username}",
            type="api",
            endpoint="http://example.invalid",
            status="up",
        )

        db.add(service)
        db.flush()

        rule = AutomationRule(
            name=f"Rule {username}",
            description="Automation API test",
            enabled=enabled,
            trigger_type="service_recovered",
            action_type="notify_webhook",
            service_id=(
                None
                if global_rule
                else service.id
            ),
            created_by_user_id=user.id,
            created_by_username=user.username,
        )

        db.add(rule)
        db.commit()

        db.refresh(user)
        db.refresh(service)
        db.refresh(rule)

        token = create_access_token(
            user_id=user.id,
            username=user.username,
        )

        return {
            "user_id": user.id,
            "service_id": service.id,
            "rule_id": rule.id,
            "token": token,
        }

    finally:
        db.close()


def _headers(seed):
    return {
        "Authorization":
            f"Bearer {seed['token']}",
    }


def _mock_webhook(
    monkeypatch,
    captured=None,
):
    monkeypatch.setattr(
        automation_service.settings,
        "automation_webhook_url",
        "http://automation-test.local/hook",
    )

    def fake_post(
        url,
        *,
        json,
        timeout,
    ):
        if captured is not None:
            captured["url"] = url
            captured["json"] = json
            captured["timeout"] = timeout

        return FakeWebhookResponse()

    monkeypatch.setattr(
        automation_service.requests,
        "post",
        fake_post,
    )


def test_manual_test_requires_authentication(
    client,
):
    seed = _seed_rule(
        username="manual_auth_required",
    )

    response = client.post(
        (
            "/automations/rules/"
            f"{seed['rule_id']}/test"
        ),
        json={},
    )

    assert response.status_code == 401


def test_manual_test_fixed_rule_succeeds(
    client,
    monkeypatch,
):
    seed = _seed_rule(
        username="manual_fixed_success",
    )

    captured = {}

    _mock_webhook(
        monkeypatch,
        captured,
    )

    response = client.post(
        (
            "/automations/rules/"
            f"{seed['rule_id']}/test"
        ),
        json={},
        headers=_headers(seed),
    )

    assert response.status_code == 200

    body = response.json()

    assert body["rule_id"] == seed["rule_id"]
    assert (
        body["trigger_type"]
        == "service_recovered"
    )
    assert (
        body["action_type"]
        == "notify_webhook"
    )
    assert (
        body["service_id"]
        == seed["service_id"]
    )
    assert body["status"] == "success"
    assert (
        body["execution_source"]
        == "manual_test"
    )
    assert body["error"] is None

    assert (
        body["trigger_payload"]["manual_test"]
        is True
    )
    assert (
        body["trigger_payload"][
            "configured_trigger_type"
        ]
        == "service_recovered"
    )

    assert (
        captured["json"]["execution_source"]
        == "manual_test"
    )
    assert (
        captured["json"]["service"]["id"]
        == seed["service_id"]
    )
    assert (
        captured["json"]["rule"][
            "trigger_type"
        ]
        == "service_recovered"
    )

    db = SessionLocal()

    try:
        execution = (
            db.query(AutomationExecution)
            .filter(
                AutomationExecution.rule_id
                == seed["rule_id"]
            )
            .one()
        )

        assert execution.status == "success"
        assert (
            execution.execution_source
            == "manual_test"
        )
        assert (
            execution.service_id
            == seed["service_id"]
        )
    finally:
        db.close()


def test_global_rule_requires_service_id(
    client,
):
    seed = _seed_rule(
        username="manual_global_required",
        global_rule=True,
    )

    response = client.post(
        (
            "/automations/rules/"
            f"{seed['rule_id']}/test"
        ),
        json={},
        headers=_headers(seed),
    )

    assert response.status_code == 422

    assert (
        response.json()["detail"]
        == (
            "Selecciona un servicio para probar "
            "una regla global"
        )
    )


def test_global_rule_accepts_selected_service(
    client,
    monkeypatch,
):
    seed = _seed_rule(
        username="manual_global_success",
        global_rule=True,
    )

    _mock_webhook(monkeypatch)

    response = client.post(
        (
            "/automations/rules/"
            f"{seed['rule_id']}/test"
        ),
        json={
            "service_id": seed["service_id"],
        },
        headers=_headers(seed),
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        body["service_id"]
        == seed["service_id"]
    )
    assert (
        body["execution_source"]
        == "manual_test"
    )
    assert body["status"] == "success"


def test_fixed_rule_rejects_other_service(
    client,
):
    seed = _seed_rule(
        username="manual_wrong_service",
    )

    db = SessionLocal()

    try:
        other_service = Service(
            name="Other service",
            type="api",
            endpoint="http://other.invalid",
            status="up",
        )

        db.add(other_service)
        db.commit()
        db.refresh(other_service)

        other_service_id = other_service.id
    finally:
        db.close()

    response = client.post(
        (
            "/automations/rules/"
            f"{seed['rule_id']}/test"
        ),
        json={
            "service_id": other_service_id,
        },
        headers=_headers(seed),
    )

    assert response.status_code == 422

    assert (
        response.json()["detail"]
        == "La regla está asociada a otro servicio"
    )


def test_disabled_rule_can_be_manually_tested(
    client,
    monkeypatch,
):
    seed = _seed_rule(
        username="manual_disabled",
        enabled=False,
    )

    _mock_webhook(monkeypatch)

    response = client.post(
        (
            "/automations/rules/"
            f"{seed['rule_id']}/test"
        ),
        json={},
        headers=_headers(seed),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert (
        response.json()["execution_source"]
        == "manual_test"
    )


def test_real_trigger_defaults_to_trigger_source(
    monkeypatch,
):
    seed = _seed_rule(
        username="automatic_trigger_source",
    )

    captured = {}

    _mock_webhook(
        monkeypatch,
        captured,
    )

    db = SessionLocal()

    try:
        rule = db.get(
            AutomationRule,
            seed["rule_id"],
        )

        service = db.get(
            Service,
            seed["service_id"],
        )

        executions = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_recovered",
                service=service,
                trigger_payload={
                    "previous_status": "down",
                    "status": "up",
                },
            )
        )

        assert len(executions) == 1

        execution = executions[0]

        assert execution.status == "success"
        assert (
            execution.execution_source
            == "trigger"
        )

        assert (
            captured["json"]["execution_source"]
            == "trigger"
        )
    finally:
        db.close()
