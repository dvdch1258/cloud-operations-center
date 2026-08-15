import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Cloud Operations Center"

    # Release/build metadata.
    version: str = os.getenv("APP_VERSION", "1.0.0")
    build_sha: str = os.getenv("BUILD_SHA", "development")
    environment: str = os.getenv("ENVIRONMENT", "development")

    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
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
