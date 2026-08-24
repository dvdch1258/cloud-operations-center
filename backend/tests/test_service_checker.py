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
