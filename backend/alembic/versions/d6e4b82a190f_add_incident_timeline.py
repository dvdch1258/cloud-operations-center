"""Add incident timeline and explicit automation correlation.

Revision ID: d6e4b82a190f
Revises: c2a9f4e7b631
"""
from alembic import op
import sqlalchemy as sa

revision = "d6e4b82a190f"
down_revision = "c2a9f4e7b631"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("automation_executions") as batch:
        batch.add_column(sa.Column("incident_id", sa.Integer(), nullable=True))
        batch.create_foreign_key(
            "fk_automation_executions_incident_id", "incidents", ["incident_id"], ["id"],
            ondelete="SET NULL",
        )
        batch.create_index("ix_automation_executions_incident_id", ["incident_id"])

    events = op.create_table(
        "incident_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("incident_id", sa.Integer(), sa.ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("actor_username", sa.String(100)),
        sa.Column("summary", sa.String(300), nullable=False),
        sa.Column("changes", sa.JSON()),
        sa.Column("trace_id", sa.String(32)),
        sa.Column("automation_execution_id", sa.Integer(), sa.ForeignKey("automation_executions.id", ondelete="SET NULL")),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_incident_events_timeline", "incident_events", ["incident_id", "occurred_at", "id"])

    # Preserve only known timestamps. Do not invent past actors, transitions or associations.
    incidents = sa.table(
        "incidents", sa.column("id", sa.Integer()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("resolved_at", sa.DateTime(timezone=True)),
    )
    for timestamp, event_type, summary in (
        (incidents.c.created_at, "created", "Creación registrada (histórico)"),
        (incidents.c.resolved_at, "resolved", "Resolución registrada (histórico)"),
    ):
        op.execute(events.insert().from_select(
            ["incident_id", "event_type", "source", "summary", "occurred_at"],
            sa.select(incidents.c.id, sa.literal(event_type), sa.literal("legacy"), sa.literal(summary), timestamp)
            .where(timestamp.is_not(None)),
        ))


def downgrade():
    op.drop_index("ix_incident_events_timeline", table_name="incident_events")
    op.drop_table("incident_events")
    with op.batch_alter_table("automation_executions") as batch:
        batch.drop_index("ix_automation_executions_incident_id")
        batch.drop_constraint("fk_automation_executions_incident_id", type_="foreignkey")
        batch.drop_column("incident_id")
