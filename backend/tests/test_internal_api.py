def test_n8n_internal_endpoint_requires_correct_api_key(client):
    unauthorized = client.get("/internal/incidents")

    assert unauthorized.status_code == 401

    authorized = client.get(
        "/internal/incidents",
        headers={
            "X-N8N-API-Key": "pytest-n8n-key",
        },
    )

    assert authorized.status_code == 200
    assert authorized.json() == []
