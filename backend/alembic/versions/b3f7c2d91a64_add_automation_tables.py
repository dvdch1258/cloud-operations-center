"""add automation tables

Revision ID: b3f7c2d91a64
Revises: e7a19c4d82f1
"""

from alembic import op
import sqlalchemy as sa


revision = "b3f7c2d91a64"
down_revision = "e7a19c4d82f1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "automation_rules",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "trigger_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "action_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "service_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "created_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "created_by_username",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["service_id"],
            ["services.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_automation_rules_id",
        "automation_rules",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_automation_rules_enabled",
        "automation_rules",
        ["enabled"],
        unique=False,
    )

    op.create_index(
        "ix_automation_rules_trigger_type",
        "automation_rules",
        ["trigger_type"],
        unique=False,
    )

    op.create_index(
        "ix_automation_rules_action_type",
        "automation_rules",
        ["action_type"],
        unique=False,
    )

    op.create_index(
        "ix_automation_rules_service_id",
        "automation_rules",
        ["service_id"],
        unique=False,
    )

    op.create_index(
        "ix_automation_rules_created_by_user_id",
        "automation_rules",
        ["created_by_user_id"],
        unique=False,
    )

    op.create_index(
        "ix_automation_rules_created_at",
        "automation_rules",
        ["created_at"],
        unique=False,
    )

    op.create_table(
        "automation_executions",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "rule_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "rule_name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "trigger_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "action_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "service_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "trigger_payload",
            sa.JSON(),
            nullable=True,
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
            ["rule_id"],
            ["automation_rules.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["service_id"],
            ["services.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_automation_executions_id",
        "automation_executions",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_automation_executions_rule_id",
        "automation_executions",
        ["rule_id"],
        unique=False,
    )

    op.create_index(
        "ix_automation_executions_trigger_type",
        "automation_executions",
        ["trigger_type"],
        unique=False,
    )

    op.create_index(
        "ix_automation_executions_action_type",
        "automation_executions",
        ["action_type"],
        unique=False,
    )

    op.create_index(
        "ix_automation_executions_service_id",
        "automation_executions",
        ["service_id"],
        unique=False,
    )

    op.create_index(
        "ix_automation_executions_status",
        "automation_executions",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_automation_executions_started_at",
        "automation_executions",
        ["started_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_automation_executions_started_at",
        table_name="automation_executions",
    )

    op.drop_index(
        "ix_automation_executions_status",
        table_name="automation_executions",
    )

    op.drop_index(
        "ix_automation_executions_service_id",
        table_name="automation_executions",
    )

    op.drop_index(
        "ix_automation_executions_action_type",
        table_name="automation_executions",
    )

    op.drop_index(
        "ix_automation_executions_trigger_type",
        table_name="automation_executions",
    )

    op.drop_index(
        "ix_automation_executions_rule_id",
        table_name="automation_executions",
    )

    op.drop_index(
        "ix_automation_executions_id",
        table_name="automation_executions",
    )

    op.drop_table("automation_executions")

    op.drop_index(
        "ix_automation_rules_created_at",
        table_name="automation_rules",
    )

    op.drop_index(
        "ix_automation_rules_created_by_user_id",
        table_name="automation_rules",
    )

    op.drop_index(
        "ix_automation_rules_service_id",
        table_name="automation_rules",
    )

    op.drop_index(
        "ix_automation_rules_action_type",
        table_name="automation_rules",
    )

    op.drop_index(
        "ix_automation_rules_trigger_type",
        table_name="automation_rules",
    )

    op.drop_index(
        "ix_automation_rules_enabled",
        table_name="automation_rules",
    )

    op.drop_index(
        "ix_automation_rules_id",
        table_name="automation_rules",
    )

    op.drop_table("automation_rules")
