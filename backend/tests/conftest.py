import os

import pytest
from fastapi.testclient import TestClient

# IMPORTANTE:
# Estas variables se fijan antes de importar la aplicación.
# Los tests nunca utilizan PostgreSQL de producción.
os.environ["DATABASE_URL"] = "sqlite:////tmp/cloud-operations-center-pytest.db"
os.environ["JWT_SECRET_KEY"] = "pytest-jwt-secret-at-least-32-bytes-long-2026-at-least-32-bytes-long-2026"
os.environ["SERVICE_CHECKER_API_KEY"] = "pytest-checker-key"
os.environ["N8N_API_KEY"] = "pytest-n8n-key"
os.environ["ENVIRONMENT"] = "test"
os.environ["OTEL_SDK_DISABLED"] = "true"

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.main import app

# Importar modelos para registrar todas las tablas en metadata.
from app.models.incident import Incident  # noqa: F401
from app.models.service import Service  # noqa: F401
from app.models.service_check import ServiceCheck  # noqa: F401
from app.models.user import User


TEST_USERNAME = "testadmin"
TEST_PASSWORD = "CorrectHorse123!"


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def user(db):
    test_user = User(
        username=TEST_USERNAME,
        password_hash=hash_password(TEST_PASSWORD),
        is_active=True,
    )

    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    return test_user


@pytest.fixture
def authenticated_client(client, user):
    response = client.post(
        "/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200

    return client


@pytest.fixture
def service(db):
    test_service = Service(
        name="Test API",
        type="api",
        endpoint="http://test-service.local/health",
        status="unknown",
    )

    db.add(test_service)
    db.commit()
    db.refresh(test_service)

    return test_service
