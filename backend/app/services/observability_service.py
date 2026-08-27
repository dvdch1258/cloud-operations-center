from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.service import Service
from app.models.service_check import ServiceCheck


def get_observability_services(
    db: Session,
    hours: int = 24,
) -> dict:
    since = (
        datetime.now(timezone.utc)
        - timedelta(hours=hours)
    )

    services = (
        db.query(Service)
        .order_by(Service.id)
        .all()
    )

    result = []

    for service in services:
        checks_query = (
            db.query(ServiceCheck)
            .filter(
                ServiceCheck.service_id == service.id,
                ServiceCheck.checked_at >= since,
            )
        )

        checks_total = checks_query.count()

        checks_up = (
            checks_query
            .filter(ServiceCheck.status == "up")
            .count()
        )

        average_response_time = (
            db.query(
                func.avg(
                    ServiceCheck.response_time_ms
                )
            )
            .filter(
                ServiceCheck.service_id == service.id,
                ServiceCheck.checked_at >= since,
            )
            .scalar()
        )

        last_check = (
            db.query(ServiceCheck)
            .filter(
                ServiceCheck.service_id == service.id
            )
            .order_by(
                ServiceCheck.checked_at.desc()
            )
            .first()
        )

        uptime_percent = (
            round(
                (checks_up / checks_total) * 100,
                2,
            )
            if checks_total
            else None
        )

        result.append(
            {
                "id": service.id,
                "name": service.name,
                "type": service.type,
                "status": service.status,
                "uptime_percent": uptime_percent,
                "average_response_time_ms": (
                    round(
                        float(
                            average_response_time
                        ),
                        2,
                    )
                    if average_response_time
                    is not None
                    else None
                ),
                "last_response_time_ms": (
                    round(
                        float(
                            last_check.response_time_ms
                        ),
                        2,
                    )
                    if last_check
                    else None
                ),
                "last_status_code": (
                    last_check.status_code
                    if last_check
                    else None
                ),
                "last_error": (
                    last_check.error
                    if last_check
                    else None
                ),
                "last_checked_at": (
                    last_check.checked_at
                    if last_check
                    else None
                ),
                "checks_total": checks_total,
            }
        )

    return {
        "period_hours": hours,
        "total": len(result),
        "up": sum(
            item["status"] == "up"
            for item in result
        ),
        "down": sum(
            item["status"] == "down"
            for item in result
        ),
        "unknown": sum(
            item["status"] not in ("up", "down")
            for item in result
        ),
        "services": result,
    }
