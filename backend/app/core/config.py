from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Cloud Operations Center"
    version: str = "0.1.0"
    environment: str = "development"

    cors_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )

    # Rango privado 100.64.0.0/10 utilizado por NetBird.
    cors_origin_regex: str = (
        r"^http://100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])"
        r"(?:\.\d{1,3}){2}:(?:5173|5175)$"
    )


settings = Settings()
