"""add resolved_at to incidents

Revision ID: e42d7a9c6f10
Revises: b7f2c1a4e903
"""

from alembic import op
import sqlalchemy as sa


revision = "e42d7a9c6f10"
down_revision = "b7f2c1a4e903"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "incidents",
        sa.Column(
            "resolved_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_incidents_service_created",
        "incidents",
        ["service_id", "created_at"],
        unique=False,
    )

    op.execute(
        """
        UPDATE incidents
        SET resolved_at = COALESCE(updated_at, created_at)
        WHERE status IN ('resolved', 'closed')
          AND resolved_at IS NULL
        """
    )


def downgrade():
    op.drop_index(
        "ix_incidents_service_created",
        table_name="incidents",
    )
    op.drop_column("incidents", "resolved_at")
