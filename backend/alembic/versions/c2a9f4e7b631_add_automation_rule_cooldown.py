"""add automation rule cooldown

Revision ID: c2a9f4e7b631
Revises: a8d31f6c4b20
Create Date: 2026-08-30
"""

from alembic import op
import sqlalchemy as sa


revision = "c2a9f4e7b631"
down_revision = "a8d31f6c4b20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "automation_rules",
        sa.Column(
            "cooldown_seconds",
            sa.Integer(),
            nullable=False,
            server_default="300",
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "automation_rules",
        "cooldown_seconds",
    )
