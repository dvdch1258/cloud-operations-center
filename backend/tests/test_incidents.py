def test_create_incident(
    authenticated_client,
    service,
):
    response = authenticated_client.post(
        "/incidents/",
        json={
            "title": "Test incident",
            "description": "Incident created by pytest",
            "severity": "medium",
            "service_id": service.id,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Test incident"
    assert data["status"] == "open"
    assert data["severity"] == "medium"
    assert data["service_id"] == service.id


def test_resolving_incident_sets_resolved_at(
    authenticated_client,
    service,
):
    created = authenticated_client.post(
        "/incidents/",
        json={
            "title": "Database incident",
            "description": "Database unavailable",
            "severity": "high",
            "service_id": service.id,
        },
    )

    incident_id = created.json()["id"]

    response = authenticated_client.put(
        f"/incidents/{incident_id}",
        json={
            "title": "Database incident",
            "description": "Database recovered",
            "severity": "high",
            "service_id": service.id,
            "status": "resolved",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "resolved"
    assert data["resolved_at"] is not None
