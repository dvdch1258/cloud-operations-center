from tests.conftest import TEST_PASSWORD, TEST_USERNAME


def test_protected_endpoint_requires_authentication(client):
    response = client.get("/services/")

    assert response.status_code == 401
    assert response.json()["detail"] == "No autenticado"


def test_login_rejects_invalid_password(client, user):
    response = client.post(
        "/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == (
        "Usuario o contraseña incorrectos"
    )


def test_login_sets_authenticated_session(client, user):
    response = client.post(
        "/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200
    assert response.json()["username"] == TEST_USERNAME
    assert "cloud_ops_session" in response.cookies

    protected_response = client.get("/services/")
    assert protected_response.status_code == 200
