from sqlalchemy.orm import Session

from app.models.security_event import SecurityEvent


def add_security_event(
    db: Session,
    *,
    event_type: str,
    severity: str,
    description: str,
    source: str = "application",
    user_id: int | None = None,
    username: str | None = None,
    ip_address: str | None = None,
) -> SecurityEvent:
    event = SecurityEvent(
        event_type=event_type,
        severity=severity,
        source=source,
        user_id=user_id,
        username=username,
        ip_address=ip_address,
        description=description,
    )

    db.add(event)

    return event
