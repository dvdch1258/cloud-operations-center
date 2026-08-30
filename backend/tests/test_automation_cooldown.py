from app.core.database import SessionLocal
from app.models.automation_execution import (
    AutomationExecution,
)
from app.models.automation_rule import (
    AutomationRule,
)
from app.models.service import Service
from app.services import automation_service


class FakeWebhookResponse:
    status_code = 200


def _create_rule(
    *,
    name: str,
    cooldown_seconds: int,
):
    db = SessionLocal()

    try:
        service = Service(
            name=f"{name} Service",
            type="api",
            endpoint="http://example.invalid",
            status="up",
        )

        db.add(service)
        db.flush()

        rule = AutomationRule(
            name=name,
            description="Cooldown pytest",
            enabled=True,
            trigger_type="service_down",
            action_type="notify_webhook",
            service_id=service.id,
            cooldown_seconds=cooldown_seconds,
            created_by_username="pytest",
        )

        db.add(rule)
        db.commit()

        db.refresh(service)
        db.refresh(rule)

        return rule.id, service.id

    finally:
        db.close()


def _mock_webhook(
    monkeypatch,
    calls,
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
        calls.append(json)
        return FakeWebhookResponse()

    monkeypatch.setattr(
        automation_service.requests,
        "post",
        fake_post,
    )


def test_second_trigger_is_skipped_by_cooldown(
    monkeypatch,
):
    rule_id, service_id = _create_rule(
        name="Cooldown enabled",
        cooldown_seconds=300,
    )

    calls = []
    _mock_webhook(monkeypatch, calls)

    db = SessionLocal()

    try:
        service = db.get(
            Service,
            service_id,
        )

        first = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        second = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        assert len(first) == 1
        assert first[0].status == "success"

        assert len(second) == 1
        assert second[0].status == "skipped"

        assert (
            second[0].execution_source
            == "trigger"
        )

        assert second[0].result["skipped"] is True
        assert (
            second[0].result["reason"]
            == "cooldown"
        )
        assert (
            second[0].result[
                "cooldown_seconds"
            ]
            == 300
        )
        assert (
            second[0].result[
                "recent_execution_id"
            ]
            == first[0].id
        )

        assert len(calls) == 1

        executions = (
            db.query(AutomationExecution)
            .filter(
                AutomationExecution.rule_id
                == rule_id
            )
            .order_by(AutomationExecution.id)
            .all()
        )

        assert [
            execution.status
            for execution in executions
        ] == [
            "success",
            "skipped",
        ]

    finally:
        db.close()


def test_cooldown_zero_does_not_skip(
    monkeypatch,
):
    _, service_id = _create_rule(
        name="Cooldown disabled",
        cooldown_seconds=0,
    )

    calls = []
    _mock_webhook(monkeypatch, calls)

    db = SessionLocal()

    try:
        service = db.get(
            Service,
            service_id,
        )

        first = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        second = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        assert first[0].status == "success"
        assert second[0].status == "success"
        assert len(calls) == 2

    finally:
        db.close()


def test_failed_trigger_starts_cooldown(
    monkeypatch,
):
    _, service_id = _create_rule(
        name="Cooldown after failure",
        cooldown_seconds=300,
    )

    calls = []

    monkeypatch.setattr(
        automation_service.settings,
        "automation_webhook_url",
        "http://automation-test.local/hook",
    )

    def failing_post(
        url,
        *,
        json,
        timeout,
    ):
        calls.append(json)
        raise (
            automation_service.requests
            .RequestException("failure")
        )

    monkeypatch.setattr(
        automation_service.requests,
        "post",
        failing_post,
    )

    db = SessionLocal()

    try:
        service = db.get(
            Service,
            service_id,
        )

        first = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        second = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        assert first[0].status == "failed"
        assert second[0].status == "skipped"
        assert len(calls) == 1

    finally:
        db.close()


def test_manual_execution_ignores_cooldown(
    monkeypatch,
):
    rule_id, service_id = _create_rule(
        name="Manual ignores cooldown",
        cooldown_seconds=300,
    )

    calls = []
    _mock_webhook(monkeypatch, calls)

    db = SessionLocal()

    try:
        rule = db.get(
            AutomationRule,
            rule_id,
        )

        service = db.get(
            Service,
            service_id,
        )

        automatic = (
            automation_service
            .run_automation_trigger(
                db,
                trigger_type="service_down",
                service=service,
                trigger_payload={
                    "status": "down",
                },
            )
        )

        manual = (
            automation_service
            .execute_automation_rule(
                db,
                rule=rule,
                service=service,
                trigger_payload={
                    "manual_test": True,
                },
                execution_source="manual_test",
            )
        )

        assert automatic[0].status == "success"
        assert manual.status == "success"
        assert (
            manual.execution_source
            == "manual_test"
        )
        assert len(calls) == 2

    finally:
        db.close()
