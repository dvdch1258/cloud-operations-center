from app.api import health as health_api


def test_detailed_health_ok(client, monkeypatch):
    monkeypatch.setattr(
        health_api,
        "check_database",
        lambda: "up",
    )

    monkeypatch.setattr(
        health_api,
        "check_prometheus",
        lambda: "up",
    )

    monkeypatch.setattr(
        health_api,
        "check_tempo",
        lambda: "up",
    )

    response = client.get("/health/detailed")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "ok"
    assert body["database"] == "up"
    assert body["prometheus"] == "up"
    assert body["tempo"] == "up"

    assert "version" in body
    assert "build_sha" in body
    assert "environment" in body
    assert "timestamp" in body


def test_detailed_health_degraded(client, monkeypatch):
    monkeypatch.setattr(
        health_api,
        "check_database",
        lambda: "up",
    )

    monkeypatch.setattr(
        health_api,
        "check_prometheus",
        lambda: "down",
    )

    monkeypatch.setattr(
        health_api,
        "check_tempo",
        lambda: "up",
    )

    response = client.get("/health/detailed")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "degraded"
    assert body["database"] == "up"
    assert body["prometheus"] == "down"
    assert body["tempo"] == "up"
