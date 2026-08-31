from app.services import tempo_service


def _tempo_payload():
    return {
        "traces": [
            {
                "traceID":
                    "1234567890abcdef1234567890abcdef",
                "rootServiceName": "backend",
                "rootTraceName": "GET /health",
                "startTimeUnixNano":
                    "1700000000000000000",
                "durationMs": 12.5,
            }
        ]
    }


def test_traces_without_service_filter(
    monkeypatch,
):
    captured = {}

    def fake_request(path, params=None):
        captured["path"] = path
        captured["params"] = params
        return _tempo_payload()

    monkeypatch.setattr(
        tempo_service,
        "_request_json",
        fake_request,
    )

    result = (
        tempo_service
        .get_observability_traces(
            hours=6,
            limit=12,
        )
    )

    assert captured["path"] == "/api/search"
    assert captured["params"]["limit"] == 12
    assert "tags" not in captured["params"]

    assert result["period_hours"] == 6
    assert result["total"] == 1


def test_traces_with_service_filter(
    monkeypatch,
):
    captured = {}

    def fake_request(path, params=None):
        captured["path"] = path
        captured["params"] = params
        return _tempo_payload()

    monkeypatch.setattr(
        tempo_service,
        "_request_json",
        fake_request,
    )

    result = (
        tempo_service
        .get_observability_traces(
            hours=24,
            limit=20,
            service="backend",
        )
    )

    assert captured["path"] == "/api/search"

    assert (
        captured["params"]["tags"]
        == "service.name=backend"
    )

    assert captured["params"]["limit"] == 20
    assert result["total"] == 1

    assert (
        result["traces"][0]["service"]
        == "backend"
    )
