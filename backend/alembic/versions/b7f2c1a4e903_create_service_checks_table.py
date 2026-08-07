"""create service checks table

Revision ID: b7f2c1a4e903
Revises: d1c659477e6c
Create Date: 2026-08-07

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7f2c1a4e903"
down_revision: Union[str, Sequence[str], None] = "d1c659477e6c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "service_checks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("response_time_ms", sa.Float(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "checked_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["service_id"],
            ["services.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_service_checks_id",
        "service_checks",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_service_checks_service_id",
        "service_checks",
        ["service_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_checks_checked_at",
        "service_checks",
        ["checked_at"],
        unique=False,
    )

    op.create_index(
        "ix_service_checks_service_checked",
        "service_checks",
        ["service_id", "checked_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_service_checks_service_checked",
        table_name="service_checks",
    )
    op.drop_index(
        "ix_service_checks_checked_at",
        table_name="service_checks",
    )
    op.drop_index(
        "ix_service_checks_service_id",
        table_name="service_checks",
    )
    op.drop_index(
        "ix_service_checks_id",
        table_name="service_checks",
    )

    op.drop_table("service_checks")
