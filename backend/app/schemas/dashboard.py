from pydantic import BaseModel


class DashboardSummary(BaseModel):
    services_total: int
    services_up: int
    services_down: int
    incidents_open: int
