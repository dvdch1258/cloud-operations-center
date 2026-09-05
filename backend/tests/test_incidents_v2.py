from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from opentelemetry import trace
from opentelemetry.trace import NonRecordingSpan, SpanContext, TraceFlags

from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.models.automation_execution import AutomationExecution
from app.models.automation_rule import AutomationRule
from app.models.service import Service
from app.services import automation_service, service_checker
from app.services.incident_event_service import record_incident_event


def create(client, service):
    response = client.post("/incidents/", json={
        "title": "API unavailable", "description": "Connection refused",
        "severity": "high", "service_id": service.id,
    })
    assert response.status_code == 200
    return response.json()["id"]


def timeline(client, incident_id):
    response = client.get(f"/incidents/{incident_id}/timeline")
    assert response.status_code == 200
    return response.json()


def test_lifecycle_records_actor_changes_notes_and_noop(authenticated_client, service):
    client = authenticated_client
    incident_id = create(client, service)
    path = f"/incidents/{incident_id}"
    assert client.post(f"{path}/notes", json={"text": "  Revisado el endpoint.  "}).status_code == 201
    assert client.patch(f"{path}/status", json={"status": "investigating"}).status_code == 200
    resolved = client.patch(f"{path}/status", json={"status": "resolved"}).json()
    assert resolved["resolved_at"]
    closed = client.patch(f"{path}/status", json={"status": "closed"}).json()
    assert closed["resolved_at"] == resolved["resolved_at"]
    reopened = client.patch(f"{path}/status", json={"status": "open"}).json()
    assert reopened["resolved_at"] is None
    assert reopened["description"] == "Connection refused"
    assert client.patch(f"{path}/status", json={"status": "open"}).status_code == 200
    result = timeline(client, incident_id)
    assert result["total"] == 6
    assert {e["actor_username"] for e in result["events"]} == {"testadmin"}
    assert result["events"][0]["changes"]["status"] == {"before": "closed", "after": "open"}
    assert result["events"][-2]["changes"]["text"] == "Revisado el endpoint."
    assert result["events"][-1]["event_type"] == "created"


def test_update_and_validation_are_recorded_without_partial_writes(authenticated_client, service):
    client = authenticated_client
    incident_id = create(client, service)
    path = f"/incidents/{incident_id}"
    original = client.get(path).json()
    payload = {k: original[k] for k in ("title", "description", "severity", "service_id", "status")}
    payload.update(title="Investigating API", severity="critical")
    assert client.put(path, json=payload).status_code == 200
    event = timeline(client, incident_id)["events"][0]
    assert event["event_type"] == "updated"
    assert set(event["changes"]) == {"title", "severity"}
    assert client.put(path, json=payload).status_code == 200
    assert timeline(client, incident_id)["total"] == 2
    payload["service_id"] = 999999
    assert client.put(path, json=payload).status_code == 404
    assert client.get(path).json()["service_id"] == service.id
    assert client.post(f"{path}/notes", json={"text": "   "}).status_code == 422
    assert client.post(f"{path}/notes", json={"text": "x" * 4001}).status_code == 422
    assert client.patch(f"{path}/status", json={"status": "invalid"}).status_code == 422


@pytest.mark.parametrize("suffix", ["details", "timeline", "automations", "logs", "traces", "correlation"])
def test_detail_endpoints_require_authentication_and_existing_incident(client, suffix):
    assert client.get(f"/incidents/1/{suffix}").status_code == 401


def test_notes_and_status_require_authentication(client):
    assert client.post("/incidents/1/notes", json={"text": "test"}).status_code == 401
    assert client.patch("/incidents/1/status", json={"status": "resolved"}).status_code == 401


def test_telemetry_clients_forward_absolute_incident_times(monkeypatch):
    from app.services import loki_service, tempo_service
    start = datetime(2026, 8, 20, 12, tzinfo=timezone.utc)
    end = start + timedelta(minutes=20)
    captured = {}
    def fake_loki(query, start, end, limit):
        captured["loki"] = (query, start, end)
        return []
    def fake_tempo(path, params=None):
        captured["tempo"] = (path, params)
        return {"traces": []}
    monkeypatch.setattr(loki_service, "_query_range", fake_loki)
    monkeypatch.setattr(tempo_service, "_request_json", fake_tempo)
    loki_service.get_observability_logs(search="incident_id=12 ", start_at=start, end_at=end)
    tempo_service.get_observability_traces(service="instrumented-api", start_at=start, end_at=end)
    assert captured["loki"][1:] == (start, end)
    assert ' |= "incident_id=12 "' in captured["loki"][0]
    assert captured["tempo"][0] == "/api/search"
    assert int(captured["tempo"][1]["start"]) == int(start.timestamp())
    assert int(captured["tempo"][1]["end"]) == int(end.timestamp())
    assert captured["tempo"][1]["tags"] == "service.name=instrumented-api"


def test_missing_incident_and_bounded_pagination(authenticated_client, service, db):
    client = authenticated_client
    for suffix in ("details", "timeline", "automations", "logs", "traces", "correlation"):
        assert client.get(f"/incidents/999/{suffix}").status_code == 404
    incident_id = create(client, service)
    now = datetime.now(timezone.utc)
    for number in range(5):
        db.add(IncidentEvent(incident_id=incident_id, event_type="note_added", source="user", summary=str(number), occurred_at=now))
    db.commit()
    page1 = client.get(f"/incidents/{incident_id}/timeline?limit=3").json()
    page2 = client.get(f"/incidents/{incident_id}/timeline?limit=3&offset=3").json()
    assert page1["total"] == 6
    ids = [e["id"] for e in page1["events"] + page2["events"]]
    assert len(set(ids)) == 6
    assert ids[:5] == sorted(ids[:5], reverse=True)
    assert client.get(f"/incidents/{incident_id}/timeline?limit=201").status_code == 422
    assert client.get(f"/incidents/{incident_id}/automations?offset=-1").status_code == 422


def test_orphaned_incident_keeps_history_and_can_be_resolved(authenticated_client, service, db):
    client = authenticated_client
    incident_id = create(client, service)
    incident = db.get(Incident, incident_id)
    # Simulate PostgreSQL's ON DELETE SET NULL (SQLite's legacy fixture disables FK checks).
    incident.service_id = None
    db.delete(service)
    db.commit()
    response = client.patch(f"/incidents/{incident_id}/status", json={"status": "resolved"})
    assert response.status_code == 200
    details = client.get(f"/incidents/{incident_id}/details").json()
    assert details["service"] is None
    assert details["timeline"]["total"] == 2


def seed_rule(db, service, trigger="service_down"):
    rule = AutomationRule(name=f"Notify {trigger}", enabled=True, service_id=service.id,
        trigger_type=trigger, action_type="notify_webhook", created_by_username="testadmin", cooldown_seconds=300)
    db.add(rule)
    db.commit()
    return rule


def fake_webhook(monkeypatch, calls, *, failed=False):
    monkeypatch.setattr(automation_service.settings, "automation_webhook_url", "https://example.invalid/hook")
    def post(url, *, json, timeout):
        calls.append(json)
        return SimpleNamespace(status_code=500 if failed else 200)
    monkeypatch.setattr(automation_service.requests, "post", post)


def test_checker_cycle_links_exact_incident_and_cooldown_to_new_incident(db, service, monkeypatch):
    seed_rule(db, service)
    seed_rule(db, service, "service_recovered")
    calls = []
    fake_webhook(monkeypatch, calls)
    monkeypatch.setattr(service_checker, "_check_endpoint", lambda _: ("down", 503, 15.0, "HTTP 503"))
    first = service_checker.check_all_services(db)
    incident = db.query(Incident).one()
    assert first["automation_executions"] == 1
    assert calls[0]["trigger"]["incident_id"] == incident.id
    assert service_checker.check_all_services(db)["automation_executions"] == 0
    monkeypatch.setattr(service_checker, "_check_endpoint", lambda _: ("up", 200, 5.0, None))
    assert service_checker.check_all_services(db)["incidents_resolved"] == 1
    executions = db.query(AutomationExecution).order_by(AutomationExecution.id).all()
    assert [e.incident_id for e in executions] == [incident.id, incident.id]
    events = db.query(IncidentEvent).filter_by(incident_id=incident.id).order_by(IncidentEvent.id).all()
    assert [e.event_type for e in events] == ["created", "automation_started", "automation_finished", "status_changed", "automation_started", "automation_finished"]
    assert events[3].changes["status"]["after"] == "resolved"
    monkeypatch.setattr(service_checker, "_check_endpoint", lambda _: ("down", 503, 10.0, "HTTP 503"))
    service_checker.check_all_services(db)
    newest = db.query(Incident).order_by(Incident.id.desc()).first()
    skipped = db.query(AutomationExecution).order_by(AutomationExecution.id.desc()).first()
    assert newest.id != incident.id
    assert skipped.status == "skipped"
    assert skipped.incident_id == newest.id
    assert db.query(IncidentEvent).filter_by(incident_id=newest.id, event_type="automation_skipped").count() == 1
    assert len(calls) == 2


def test_failed_and_manual_automations_and_cross_service_guard(db, service, monkeypatch):
    rule = seed_rule(db, service)
    incident = Incident(title="down", description="down", severity="high", status="open", service_id=service.id)
    db.add(incident); db.commit()
    calls = []; fake_webhook(monkeypatch, calls, failed=True)
    execution = automation_service.execute_automation_rule(db, rule=rule, service=service, trigger_payload={}, incident_id=incident.id)
    assert execution.status == "failed"
    assert db.query(IncidentEvent).filter_by(event_type="automation_finished").one().changes["execution_status"] == "failed"
    manual = automation_service.execute_automation_rule(db, rule=rule, service=service, trigger_payload={}, incident_id=incident.id, execution_source="manual_test")
    assert manual.incident_id is None
    assert db.query(IncidentEvent).count() == 2
    other = Service(name="other", type="api", endpoint="https://example.invalid", status="up")
    db.add(other); db.commit()
    with pytest.raises(ValueError):
        automation_service.run_automation_trigger(db, trigger_type="service_down", service=other, trigger_payload={}, incident_id=incident.id)
    assert len(calls) == 2


def test_detail_excludes_unlinked_executions_and_delete_preserves_audit(authenticated_client, service, db, monkeypatch):
    client = authenticated_client
    incident_id = create(client, service)
    rule = seed_rule(db, service)
    calls = []; fake_webhook(monkeypatch, calls)
    linked = automation_service.execute_automation_rule(db, rule=rule, service=service, trigger_payload={}, incident_id=incident_id)
    automation_service.execute_automation_rule(db, rule=rule, service=service, trigger_payload={})
    details = client.get(f"/incidents/{incident_id}/details").json()
    assert details["service"]["id"] == service.id
    assert details["automations_total"] == 1
    assert details["automations"][0]["id"] == linked.id
    assert client.delete(f"/incidents/{incident_id}").status_code == 200
    db.expire_all()
    assert db.query(AutomationExecution).count() == 2
    assert db.get(AutomationExecution, linked.id).incident_id is None
    assert db.query(IncidentEvent).count() == 0


def test_incident_and_events_rollback_together(db, service):
    incident = Incident(title="rollback", description="rollback", severity="low", status="open", service_id=service.id)
    db.add(incident)
    record_incident_event(db, incident, event_type="created", source="checker", summary="test")
    db.flush()
    db.rollback()
    assert db.query(Incident).count() == 0
    assert db.query(IncidentEvent).count() == 0


def test_telemetry_uses_incident_window_and_exact_id_and_reports_outages(authenticated_client, service, db, monkeypatch):
    client = authenticated_client
    incident_id = create(client, service)
    incident = db.get(Incident, incident_id)
    incident.created_at = datetime(2026, 1, 1, 10, tzinfo=timezone.utc)
    incident.resolved_at = datetime(2026, 1, 1, 11, tzinfo=timezone.utc)
    incident.status = "resolved"
    db.commit()
    from app.api import incidents as routes
    captured = {}
    def get_logs(**kwargs):
        captured.update(kwargs)
        return {"logs": [], "total": 0}
    monkeypatch.setattr(routes, "get_observability_logs", get_logs)
    result = client.get(f"/incidents/{incident_id}/logs").json()
    assert result["scope"] == "incident"
    assert captured["search"] == f"incident_id={incident_id} "
    assert captured["start_at"] == datetime(2026, 1, 1, 9, 55, tzinfo=timezone.utc)
    assert captured["end_at"] == datetime(2026, 1, 1, 11, 5, tzinfo=timezone.utc)
    client.get(f"/incidents/{incident_id}/logs?service=backend")
    assert captured["service"] == "backend" and captured["search"] is None
    monkeypatch.setattr(routes, "get_observability_traces", lambda **kw: (captured.update(kw) or {"traces": [], "total": 0}))
    assert client.get(f"/incidents/{incident_id}/traces?service=my-backend").json()["scope"] == "service"
    assert captured["service"] == "my-backend"
    assert captured["end_at"].year == 2026 and captured["end_at"].month == 1
    def unavailable(**kw):
        raise routes.LokiQueryError("internal upstream information")
    monkeypatch.setattr(routes, "get_observability_logs", unavailable)
    response = client.get(f"/incidents/{incident_id}/logs")
    assert response.status_code == 503 and response.json()["detail"] == "Loki no disponible"
    assert client.get(f"/incidents/{incident_id}/details").status_code == 200


def test_captured_traces_are_exact_deduplicated_and_window_is_bounded(authenticated_client, service, db):
    client = authenticated_client
    incident_id = create(client, service)
    incident = db.get(Incident, incident_id)
    incident.created_at = datetime.now(timezone.utc) - timedelta(days=30)
    context = SpanContext(trace_id=123456, span_id=12, is_remote=False, trace_flags=TraceFlags(1))
    with trace.use_span(NonRecordingSpan(context)):
        for _ in range(2):
            record_incident_event(db, incident, event_type="updated", source="user", summary="traced")
    db.commit()
    result = client.get(f"/incidents/{incident_id}/traces").json()
    assert result["scope"] == "incident"
    assert [item["trace_id"] for item in result["traces"]] == [f"{123456:032x}"]
    assert result["window"]["truncated"] is True
    start = datetime.fromisoformat(result["window"]["start_at"])
    end = datetime.fromisoformat(result["window"]["end_at"])
    assert end - start == timedelta(days=7)


def test_correlation_uses_incident_service_and_window(
    authenticated_client,
    service,
    db,
    monkeypatch,
):
    client = authenticated_client
    incident_id = create(client, service)
    incident = db.get(Incident, incident_id)

    incident.created_at = datetime(
        2026,
        1,
        1,
        10,
        0,
        tzinfo=timezone.utc,
    )
    incident.resolved_at = datetime(
        2026,
        1,
        1,
        11,
        0,
        tzinfo=timezone.utc,
    )
    incident.status = "resolved"
    db.commit()

    from app.services import (
        incident_correlation_service as correlation,
    )

    captured = {}

    def fake_logs(**kwargs):
        captured["logs"] = kwargs

        return {
            "total": 3,
            "logs": [
                {
                    "level": "error",
                    "message": "database unavailable",
                },
                {
                    "level": "critical",
                    "message": "request failed",
                },
                {
                    "level": "info",
                    "message": "retrying",
                },
            ],
        }

    def fake_traces(**kwargs):
        captured["traces"] = kwargs

        return {
            "total": 1,
            "traces": [
                {
                    "trace_id": "1" * 32,
                    "service": service.name,
                    "operation": "GET /health",
                    "started_at": incident.created_at,
                    "duration_ms": 125.0,
                }
            ],
        }

    monkeypatch.setattr(
        correlation,
        "get_observability_logs",
        fake_logs,
    )
    monkeypatch.setattr(
        correlation,
        "get_observability_traces",
        fake_traces,
    )

    response = client.get(
        f"/incidents/{incident_id}/correlation"
    )

    assert response.status_code == 200
    result = response.json()

    assert result["incident_id"] == incident_id
    assert result["service"]["id"] == service.id
    assert result["service"]["name"] == service.name

    assert result["sources"] == {
        "loki": "available",
        "tempo": "available",
    }

    assert result["summary"]["logs_total"] == 3
    assert result["summary"]["errors_total"] == 2
    assert result["summary"]["traces_total"] == 1
    assert (
        result["summary"]["captured_traces_total"]
        == 0
    )

    expected_start = datetime(
        2026,
        1,
        1,
        9,
        55,
        tzinfo=timezone.utc,
    )
    expected_end = datetime(
        2026,
        1,
        1,
        11,
        5,
        tzinfo=timezone.utc,
    )

    assert (
        captured["logs"]["service"]
        == service.observability_name
    )
    assert captured["logs"]["search"] is None
    assert (
        captured["logs"]["start_at"]
        == expected_start
    )
    assert (
        captured["logs"]["end_at"]
        == expected_end
    )

    assert (
        captured["traces"]["service"]
        == service.observability_name
    )
    assert (
        captured["traces"]["start_at"]
        == expected_start
    )
    assert (
        captured["traces"]["end_at"]
        == expected_end
    )


def test_correlation_degrades_when_loki_is_unavailable(
    authenticated_client,
    service,
    monkeypatch,
):
    client = authenticated_client
    incident_id = create(client, service)

    from app.services import (
        incident_correlation_service as correlation,
    )

    def unavailable_logs(**kwargs):
        raise correlation.LokiQueryError(
            "sensitive upstream error"
        )

    monkeypatch.setattr(
        correlation,
        "get_observability_logs",
        unavailable_logs,
    )

    monkeypatch.setattr(
        correlation,
        "get_observability_traces",
        lambda **kwargs: {
            "total": 1,
            "traces": [
                {
                    "trace_id": "2" * 32,
                    "service": service.name,
                    "operation": "GET /health",
                    "started_at": None,
                    "duration_ms": 25.0,
                }
            ],
        },
    )

    response = client.get(
        f"/incidents/{incident_id}/correlation"
    )

    assert response.status_code == 200
    result = response.json()

    assert (
        result["sources"]["loki"]
        == "unavailable"
    )
    assert (
        result["sources"]["tempo"]
        == "available"
    )
    assert result["logs"] == []
    assert result["summary"]["logs_total"] == 0
    assert result["summary"]["errors_total"] == 0
    assert result["summary"]["traces_total"] == 1


def test_correlation_degrades_when_tempo_is_unavailable(
    authenticated_client,
    service,
    monkeypatch,
):
    client = authenticated_client
    incident_id = create(client, service)

    from app.services import (
        incident_correlation_service as correlation,
    )

    monkeypatch.setattr(
        correlation,
        "get_observability_logs",
        lambda **kwargs: {
            "total": 1,
            "logs": [
                {
                    "level": "warning",
                    "message": "slow request",
                }
            ],
        },
    )

    def unavailable_traces(**kwargs):
        raise correlation.TempoQueryError(
            "sensitive upstream error"
        )

    monkeypatch.setattr(
        correlation,
        "get_observability_traces",
        unavailable_traces,
    )

    response = client.get(
        f"/incidents/{incident_id}/correlation"
    )

    assert response.status_code == 200
    result = response.json()

    assert (
        result["sources"]["loki"]
        == "available"
    )
    assert (
        result["sources"]["tempo"]
        == "unavailable"
    )
    assert result["summary"]["logs_total"] == 1
    assert result["summary"]["errors_total"] == 0
    assert result["traces"] == []


def test_correlation_without_service_uses_incident_id(
    authenticated_client,
    service,
    db,
    monkeypatch,
):
    client = authenticated_client
    incident_id = create(client, service)
    incident = db.get(Incident, incident_id)

    incident.service_id = None
    db.commit()

    from app.services import (
        incident_correlation_service as correlation,
    )

    captured = {}

    def fake_logs(**kwargs):
        captured.update(kwargs)

        return {
            "total": 0,
            "logs": [],
        }

    def tempo_must_not_run(**kwargs):
        raise AssertionError(
            "Tempo no debe consultarse sin servicio"
        )

    monkeypatch.setattr(
        correlation,
        "get_observability_logs",
        fake_logs,
    )
    monkeypatch.setattr(
        correlation,
        "get_observability_traces",
        tempo_must_not_run,
    )

    response = client.get(
        f"/incidents/{incident_id}/correlation"
    )

    assert response.status_code == 200
    result = response.json()

    assert result["service"] is None
    assert (
        result["sources"]["loki"]
        == "available"
    )
    assert (
        result["sources"]["tempo"]
        == "skipped"
    )
    assert captured["service"] is None
    assert captured["search"] == (
        f"incident_id={incident_id} "
    )


def test_correlation_without_observability_name_uses_incident_id(
    authenticated_client,
    service,
    db,
    monkeypatch,
):
    client = authenticated_client

    service.observability_name = None
    db.commit()

    incident_id = create(client, service)

    from app.services import (
        incident_correlation_service as correlation,
    )

    captured = {}

    def fake_logs(**kwargs):
        captured["logs"] = kwargs

        return {
            "total": 0,
            "logs": [],
        }

    def unexpected_tempo(**kwargs):
        raise AssertionError(
            "Tempo must not be queried without "
            "observability_name"
        )

    monkeypatch.setattr(
        correlation,
        "get_observability_logs",
        fake_logs,
    )

    monkeypatch.setattr(
        correlation,
        "get_observability_traces",
        unexpected_tempo,
    )

    response = client.get(
        f"/incidents/{incident_id}/correlation"
    )

    assert response.status_code == 200

    result = response.json()

    assert result["service"]["id"] == service.id

    assert (
        result["service"]["observability_name"]
        is None
    )

    assert result["sources"] == {
        "loki": "available",
        "tempo": "skipped",
    }

    assert captured["logs"]["service"] is None

    assert (
        captured["logs"]["search"]
        == f"incident_id={incident_id} "
    )
