"""add security events

Revision ID: a8c4e21f7b93
Revises: f5fb15586992
Create Date: 2026-08-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a8c4e21f7b93"
down_revision: Union[str, None] = "f5fb15586992"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "security_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column(
            "severity",
            sa.String(length=20),
            server_default="info",
            nullable=False,
        ),
        sa.Column(
            "source",
            sa.String(length=50),
            server_default="application",
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("username", sa.String(length=100), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_security_events_id",
        "security_events",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_security_events_event_type",
        "security_events",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        "ix_security_events_severity",
        "security_events",
        ["severity"],
        unique=False,
    )
    op.create_index(
        "ix_security_events_user_id",
        "security_events",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_security_events_username",
        "security_events",
        ["username"],
        unique=False,
    )
    op.create_index(
        "ix_security_events_created_at",
        "security_events",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_security_events_created_at",
        table_name="security_events",
    )
    op.drop_index(
        "ix_security_events_username",
        table_name="security_events",
    )
    op.drop_index(
        "ix_security_events_user_id",
        table_name="security_events",
    )
    op.drop_index(
        "ix_security_events_severity",
        table_name="security_events",
    )
    op.drop_index(
        "ix_security_events_event_type",
        table_name="security_events",
    )
    op.drop_index(
        "ix_security_events_id",
        table_name="security_events",
    )

    op.drop_table("security_events")
