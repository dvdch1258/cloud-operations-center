from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok"
    }


@router.get("/health/detailed")
def detailed_health():
    return {
        "status": "ok",
        "service": "cloud-operations-backend",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
