def test_create_service(authenticated_client):
    response = authenticated_client.post(
        "/services/",
        json={
            "name": "Payments API",
            "observability_name": "payments-api",
            "type": "api",
            "endpoint": "http://payments.local/health",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Payments API"
    assert data["observability_name"] == "payments-api"
    assert data["type"] == "api"
    assert data["status"] == "unknown"


def test_list_services(authenticated_client, service):
    response = authenticated_client.get("/services/")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == service.id
    assert data[0]["name"] == "Test API"


def test_update_service_preserves_observability_name_when_omitted(
    authenticated_client,
):
    created = authenticated_client.post(
        "/services/",
        json={
            "name": "Preserve API",
            "observability_name": "preserve-api",
            "type": "api",
            "endpoint": "http://preserve.local/health",
        },
    )

    assert created.status_code == 200

    service = created.json()

    updated = authenticated_client.put(
        f"/services/{service['id']}",
        json={
            "name": "Preserve API",
            "type": "api",
            "endpoint": "http://preserve.local/health",
            "status": "up",
        },
    )

    assert updated.status_code == 200

    assert (
        updated.json()["observability_name"]
        == "preserve-api"
    )


def test_update_service_can_clear_observability_name(
    authenticated_client,
):
    created = authenticated_client.post(
        "/services/",
        json={
            "name": "Clear API",
            "observability_name": "clear-api",
            "type": "api",
            "endpoint": "http://clear.local/health",
        },
    )

    assert created.status_code == 200

    service = created.json()

    updated = authenticated_client.put(
        f"/services/{service['id']}",
        json={
            "name": "Clear API",
            "observability_name": None,
            "type": "api",
            "endpoint": "http://clear.local/health",
            "status": "up",
        },
    )

    assert updated.status_code == 200
    assert (
        updated.json()["observability_name"]
        is None
    )
