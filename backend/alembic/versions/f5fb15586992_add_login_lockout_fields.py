"""add login lockout fields

Revision ID: f5fb15586992
Revises: a8c41d7b9e20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f5fb15586992"
down_revision: Union[str, Sequence[str], None] = "a8c41d7b9e20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "locked_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
