from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    alert_key = Column(
        String(500),
        nullable=False,
        unique=True,
        index=True,
    )

    source = Column(
        String(50),
        nullable=False,
        index=True,
    )

    category = Column(
        String(50),
        nullable=False,
        index=True,
    )

    severity = Column(
        String(20),
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="open",
        server_default="open",
        index=True,
    )

    title = Column(
        String(500),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    component = Column(
        String(50),
        nullable=True,
        index=True,
    )

    vulnerability_id = Column(
        String(100),
        nullable=True,
        index=True,
    )

    package_name = Column(
        String(255),
        nullable=True,
    )

    finding_id = Column(
        Integer,
        ForeignKey(
            "vulnerability_findings.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    first_seen_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    last_seen_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    acknowledged_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
