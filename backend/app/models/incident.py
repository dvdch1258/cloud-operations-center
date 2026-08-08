from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    description = Column(Text, nullable=False)

    severity = Column(String, nullable=False)

    status = Column(String, nullable=False, default="open")

    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    resolved_at = Column(DateTime(timezone=True), nullable=True)
