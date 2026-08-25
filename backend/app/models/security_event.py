from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)

    event_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    severity = Column(
        String(20),
        nullable=False,
        default="info",
        server_default="info",
        index=True,
    )

    source = Column(
        String(50),
        nullable=False,
        default="application",
        server_default="application",
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    username = Column(
        String(100),
        nullable=True,
        index=True,
    )

    ip_address = Column(
        String(45),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
