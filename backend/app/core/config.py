import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Cloud Operations Center"

    # Release/build metadata.
    version: str = os.getenv("APP_VERSION", "1.0.1")
    build_sha: str = os.getenv("BUILD_SHA", "development")
    environment: str = os.getenv("ENVIRONMENT", "development")

    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    login_max_attempts: int = int(
        os.getenv("LOGIN_MAX_ATTEMPTS", "5")
    )

    login_lock_minutes: int = int(
        os.getenv("LOGIN_LOCK_MINUTES", "15")
    )


    auth_cookie_name: str = os.getenv(
        "AUTH_COOKIE_NAME",
        "cloud_ops_session",
    )

    service_checker_api_key: str = os.getenv(
        "SERVICE_CHECKER_API_KEY",
        "",
    )

    n8n_api_key: str = os.getenv(
        "N8N_API_KEY",
        "",
    )

    automation_webhook_url: str = os.getenv(
        "AUTOMATION_WEBHOOK_URL",
        "",
    )

    vulnerability_ingest_api_key: str = os.getenv(
        "VULNERABILITY_INGEST_API_KEY",
        "",
    )

    prometheus_url: str = os.getenv(
        "PROMETHEUS_URL",
        "http://prometheus.monitoring.svc.cluster.local:9090",
    )

    loki_url: str = os.getenv(
        "LOKI_URL",
        "http://loki.monitoring.svc.cluster.local:3100",
    )

    tempo_url: str = os.getenv(
        "TEMPO_URL",
        "http://tempo.monitoring.svc.cluster.local:3200",
    )

    cors_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://app.cloudopscenter.es",
    )

    # Rango privado 100.64.0.0/10 utilizado por NetBird.
    cors_origin_regex: str = (
        r"^http://100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])"
        r"(?:\.\d{1,3}){2}:(?:5173|5175)$"
    )


settings = Settings()
