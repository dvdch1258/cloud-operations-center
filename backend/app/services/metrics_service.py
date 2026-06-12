from prometheus_client import Gauge

from app.core.database import SessionLocal
from app.models.incident import Incident
from app.models.service import Service

services_total_gauge = Gauge(
    "coc_services_total",
    "Total number of registered services"
)

services_up_gauge = Gauge(
    "coc_services_up",
    "Total number of services with UP status"
)

services_down_gauge = Gauge(
    "coc_services_down",
    "Total number of services with DOWN status"
)

incidents_open_gauge = Gauge(
    "coc_incidents_open",
    "Total number of open incidents"
)


def update_business_metrics():
    db = SessionLocal()

    try:
        services_total = db.query(Service).count()

        services_up = (
            db.query(Service)
            .filter(Service.status == "up")
            .count()
        )

        services_down = (
            db.query(Service)
            .filter(Service.status == "down")
            .count()
        )

        incidents_open = (
            db.query(Incident)
            .filter(Incident.status == "open")
            .count()
        )

        services_total_gauge.set(services_total)
        services_up_gauge.set(services_up)
        services_down_gauge.set(services_down)
        incidents_open_gauge.set(incidents_open)

    finally:
        db.close()
