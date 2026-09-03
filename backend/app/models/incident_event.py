from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.sql import func

from app.core.database import Base


class IncidentEvent(Base):
    __tablename__ = "incident_events"
    __table_args__ = (
        Index("ix_incident_events_timeline", "incident_id", "occurred_at", "id"),
    )

    id = Column(Integer, primary_key=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(40), nullable=False)
    source = Column(String(30), nullable=False)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_username = Column(String(100), nullable=True)
    summary = Column(String(300), nullable=False)
    changes = Column(JSON, nullable=True)
    trace_id = Column(String(32), nullable=True)
    automation_execution_id = Column(
        Integer, ForeignKey("automation_executions.id", ondelete="SET NULL"), nullable=True
    )
    occurred_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
