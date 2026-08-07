from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class ServiceCheck(Base):
    __tablename__ = "service_checks"

    id = Column(Integer, primary_key=True, index=True)

    service_id = Column(
        Integer,
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(String, nullable=False)

    status_code = Column(Integer, nullable=True)

    response_time_ms = Column(Float, nullable=False)

    error = Column(Text, nullable=True)

    checked_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
