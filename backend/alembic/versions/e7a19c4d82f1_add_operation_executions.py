"""add operation executions

Revision ID: e7a19c4d82f1
Revises: d9e2f43b7a61
"""

from alembic import op
import sqlalchemy as sa


revision = "e7a19c4d82f1"
down_revision = "d9e2f43b7a61"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "operation_executions",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "operation",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "requested_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "requested_by_username",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "finished_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "duration_ms",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "result",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "error",
            sa.Text(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["requested_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_operation_executions_id",
        "operation_executions",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_operation_executions_operation",
        "operation_executions",
        ["operation"],
        unique=False,
    )

    op.create_index(
        "ix_operation_executions_status",
        "operation_executions",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_operation_executions_user_id",
        "operation_executions",
        ["requested_by_user_id"],
        unique=False,
    )

    op.create_index(
        "ix_operation_executions_started_at",
        "operation_executions",
        ["started_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_operation_executions_started_at",
        table_name="operation_executions",
    )

    op.drop_index(
        "ix_operation_executions_user_id",
        table_name="operation_executions",
    )

    op.drop_index(
        "ix_operation_executions_status",
        table_name="operation_executions",
    )

    op.drop_index(
        "ix_operation_executions_operation",
        table_name="operation_executions",
    )

    op.drop_index(
        "ix_operation_executions_id",
        table_name="operation_executions",
    )

    op.drop_table("operation_executions")
