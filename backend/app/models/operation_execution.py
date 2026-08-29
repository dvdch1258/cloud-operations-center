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


class OperationExecution(Base):
    __tablename__ = "operation_executions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    operation = Column(
        String(100),
        nullable=False,
        index=True,
    )

    status = Column(
        String(20),
        nullable=False,
        index=True,
    )

    requested_by_user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    requested_by_username = Column(
        String(100),
        nullable=False,
    )

    started_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
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
