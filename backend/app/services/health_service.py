import requests
from sqlalchemy import text

from app.core.database import SessionLocal


def check_database():
    try:
        db = SessionLocal()

        db.execute(text("SELECT 1"))

        db.close()

        return "up"

    except Exception:
        return "down"


def check_prometheus():
    try:
        response = requests.get(
            "http://prometheus:9090/-/healthy",
            timeout=2
        )

        return "up" if response.status_code == 200 else "down"

    except Exception:
        return "down"


def check_tempo():
    try:
        response = requests.get(
            "http://tempo:3200/ready",
            timeout=2
        )

        return "up" if response.status_code == 200 else "down"

    except Exception:
        return "down"
