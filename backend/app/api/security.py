from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.security_event import SecurityEvent
from app.models.user import User
from app.schemas.security import (
    SecurityEventResponse,
    SecuritySummaryResponse,
)


router = APIRouter(
    prefix="/security",
    tags=["security"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/events",
    response_model=list[SecurityEventResponse],
)
def get_security_events(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get(
    "/summary",
    response_model=SecuritySummaryResponse,
)
def get_security_summary(
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)

    events_last_24h = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.created_at >= since)
        .count()
    )

    failed_logins_last_24h = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "login_failed",
            SecurityEvent.created_at >= since,
        )
        .count()
    )

    lockouts_last_24h = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "account_locked",
            SecurityEvent.created_at >= since,
        )
        .count()
    )

    locked_users = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            User.locked_until.isnot(None),
            User.locked_until > now,
        )
        .count()
    )

    active_users = (
        db.query(User)
        .filter(User.is_active.is_(True))
        .count()
    )

    return SecuritySummaryResponse(
        events_last_24h=events_last_24h,
        failed_logins_last_24h=failed_logins_last_24h,
        lockouts_last_24h=lockouts_last_24h,
        locked_users=locked_users,
        active_users=active_users,
    )
