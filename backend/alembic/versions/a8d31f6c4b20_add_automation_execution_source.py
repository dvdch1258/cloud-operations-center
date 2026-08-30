"""add automation execution source

Revision ID: a8d31f6c4b20
Revises: f4c8d2a71e90
Create Date: 2026-08-30
"""

from alembic import op
import sqlalchemy as sa


revision = "a8d31f6c4b20"
down_revision = "f4c8d2a71e90"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "automation_executions",
        sa.Column(
            "execution_source",
            sa.String(length=30),
            nullable=False,
            server_default="trigger",
        ),
    )

    op.create_index(
        "ix_automation_executions_execution_source",
        "automation_executions",
        ["execution_source"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_automation_executions_execution_source",
        table_name="automation_executions",
    )

    op.drop_column(
        "automation_executions",
        "execution_source",
    )
