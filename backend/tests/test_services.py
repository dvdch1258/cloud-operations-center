def test_create_service(authenticated_client):
    response = authenticated_client.post(
        "/services/",
        json={
            "name": "Payments API",
            "type": "api",
            "endpoint": "http://payments.local/health",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Payments API"
    assert data["type"] == "api"
    assert data["status"] == "unknown"


def test_list_services(authenticated_client, service):
    response = authenticated_client.get("/services/")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == service.id
    assert data[0]["name"] == "Test API"
