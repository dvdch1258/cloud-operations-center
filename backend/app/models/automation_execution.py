from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class AutomationExecution(Base):
    __tablename__ = "automation_executions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    rule_id = Column(
        Integer,
        ForeignKey(
            "automation_rules.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    rule_name = Column(
        String(150),
        nullable=False,
    )

    trigger_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    action_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    service_id = Column(
        Integer,
        ForeignKey(
            "services.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    status = Column(
        String(20),
        nullable=False,
        index=True,
    )

    trigger_payload = Column(
        JSON,
        nullable=True,
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    finished_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    duration_ms = Column(
        Float,
        nullable=True,
    )

    result = Column(
        JSON,
        nullable=True,
    )

    error = Column(
        Text,
        nullable=True,
    )
