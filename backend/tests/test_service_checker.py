import requests

from app.models.incident import Incident
from app.models.service_check import ServiceCheck
from app.services.service_checker import check_all_services


class FakeResponse:
    def __init__(self, status_code):
        self.status_code = status_code


def test_checker_marks_healthy_service_up(
    db,
    service,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        lambda *args, **kwargs: FakeResponse(200),
    )

    result = check_all_services(db)

    db.refresh(service)

    assert result["services_checked"] == 1
    assert result["services_up"] == 1
    assert result["services_down"] == 0
    assert service.status == "up"

    check = db.query(ServiceCheck).one()

    assert check.status == "up"
    assert check.status_code == 200
    assert check.error is None


def test_checker_creates_auto_incident_when_service_is_down(
    db,
    service,
    monkeypatch,
):
    def connection_failure(*args, **kwargs):
        raise requests.ConnectionError("connection refused")

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        connection_failure,
    )

    result = check_all_services(db)

    db.refresh(service)

    assert result["services_down"] == 1
    assert result["incidents_created"] == 1
    assert service.status == "down"

    incident = db.query(Incident).one()

    assert incident.status == "open"
    assert incident.severity == "high"
    assert incident.title.startswith("[AUTO]")
    assert incident.service_id == service.id


def test_checker_resolves_auto_incident_after_recovery(
    db,
    service,
    monkeypatch,
):
    def connection_failure(*args, **kwargs):
        raise requests.ConnectionError("connection refused")

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        connection_failure,
    )

    first_result = check_all_services(db)

    assert first_result["incidents_created"] == 1

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        lambda *args, **kwargs: FakeResponse(200),
    )

    second_result = check_all_services(db)

    incident = db.query(Incident).one()

    assert second_result["incidents_resolved"] == 1
    assert incident.status == "resolved"
    assert incident.resolved_at is not None

    db.refresh(service)
    assert service.status == "up"


def test_checker_triggers_service_down_on_up_to_down(
    db,
    service,
    monkeypatch,
):
    service.status = "up"
    db.commit()

    def connection_failure(*args, **kwargs):
        raise requests.ConnectionError("connection refused")

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        connection_failure,
    )

    captured_triggers = []

    def fake_run_automation_trigger(
        db,
        *,
        trigger_type,
        service,
        trigger_payload,
        incident_id=None,
    ):
        captured_triggers.append(
            {
                "trigger_type": trigger_type,
                "service_id": service.id,
                "incident_id": incident_id,
                "payload": trigger_payload,
            }
        )
        return []

    monkeypatch.setattr(
        "app.services.service_checker.run_automation_trigger",
        fake_run_automation_trigger,
    )

    result = check_all_services(db)

    assert captured_triggers == [
        {
            "trigger_type": "service_down",
            "service_id": service.id,
            "incident_id": db.query(Incident).one().id,
            "payload": {
                "previous_status": "up",
                "status": "down",
                "status_code": None,
                "response_time_ms":
                    captured_triggers[0]["payload"][
                        "response_time_ms"
                    ],
                "error": "connection refused",
            },
        }
    ]

    assert result["automation_trigger_events"] == 1


def test_checker_triggers_service_recovered_on_down_to_up(
    db,
    service,
    monkeypatch,
):
    service.status = "down"
    db.commit()

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        lambda *args, **kwargs: FakeResponse(200),
    )

    captured_triggers = []

    def fake_run_automation_trigger(
        db,
        *,
        trigger_type,
        service,
        trigger_payload,
        incident_id=None,
    ):
        captured_triggers.append(
            {
                "trigger_type": trigger_type,
                "service_id": service.id,
                "payload": trigger_payload,
            }
        )
        return []

    monkeypatch.setattr(
        "app.services.service_checker.run_automation_trigger",
        fake_run_automation_trigger,
    )

    result = check_all_services(db)

    assert len(captured_triggers) == 1
    assert (
        captured_triggers[0]["trigger_type"]
        == "service_recovered"
    )
    assert captured_triggers[0]["service_id"] == service.id
    assert (
        captured_triggers[0]["payload"]["previous_status"]
        == "down"
    )
    assert captured_triggers[0]["payload"]["status"] == "up"
    assert captured_triggers[0]["payload"]["status_code"] == 200
    assert captured_triggers[0]["payload"]["error"] is None

    assert result["automation_trigger_events"] == 1


def test_checker_does_not_trigger_automation_on_up_to_up(
    db,
    service,
    monkeypatch,
):
    service.status = "up"
    db.commit()

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        lambda *args, **kwargs: FakeResponse(200),
    )

    captured_triggers = []

    def fake_run_automation_trigger(
        db,
        *,
        trigger_type,
        service,
        trigger_payload,
        incident_id=None,
    ):
        captured_triggers.append(trigger_type)
        return []

    monkeypatch.setattr(
        "app.services.service_checker.run_automation_trigger",
        fake_run_automation_trigger,
    )

    result = check_all_services(db)

    assert captured_triggers == []
    assert result["automation_trigger_events"] == 0


def test_checker_does_not_trigger_automation_on_down_to_down(
    db,
    service,
    monkeypatch,
):
    service.status = "down"
    db.commit()

    def connection_failure(*args, **kwargs):
        raise requests.ConnectionError("connection refused")

    monkeypatch.setattr(
        "app.services.service_checker.requests.get",
        connection_failure,
    )

    captured_triggers = []

    def fake_run_automation_trigger(
        db,
        *,
        trigger_type,
        service,
        trigger_payload,
        incident_id=None,
    ):
        captured_triggers.append(trigger_type)
        return []

    monkeypatch.setattr(
        "app.services.service_checker.run_automation_trigger",
        fake_run_automation_trigger,
    )

    result = check_all_services(db)

    assert captured_triggers == []
    assert result["automation_trigger_events"] == 0
