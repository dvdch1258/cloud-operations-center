from fastapi import APIRouter

from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    return {
        "services_total": 3,
        "services_up": 2,
        "services_down": 1,
        "incidents_open": 1
    }
