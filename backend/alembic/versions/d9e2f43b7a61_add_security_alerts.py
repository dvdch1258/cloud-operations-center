"""add security alerts

Revision ID: d9e2f43b7a61
Revises: c31f7a82d604
"""

from alembic import op
import sqlalchemy as sa


revision = "d9e2f43b7a61"
down_revision = "c31f7a82d604"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "security_alerts",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "alert_key",
            sa.String(length=500),
            nullable=False,
        ),
        sa.Column(
            "source",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "category",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "severity",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="open",
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(length=500),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "component",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "vulnerability_id",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "package_name",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "finding_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "acknowledged_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "resolved_at",
            sa.DateTime(timezone=True),
            nullable=True,
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
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["finding_id"],
            ["vulnerability_findings.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("alert_key"),
    )

    op.create_index(
        op.f("ix_security_alerts_id"),
        "security_alerts",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_security_alerts_alert_key"),
        "security_alerts",
        ["alert_key"],
        unique=True,
    )

    for column in (
        "source",
        "category",
        "severity",
        "status",
        "component",
        "vulnerability_id",
        "finding_id",
    ):
        op.create_index(
            op.f(f"ix_security_alerts_{column}"),
            "security_alerts",
            [column],
            unique=False,
        )


def downgrade():
    for column in (
        "finding_id",
        "vulnerability_id",
        "component",
        "status",
        "severity",
        "category",
        "source",
    ):
        op.drop_index(
            op.f(f"ix_security_alerts_{column}"),
            table_name="security_alerts",
        )

    op.drop_index(
        op.f("ix_security_alerts_alert_key"),
        table_name="security_alerts",
    )

    op.drop_index(
        op.f("ix_security_alerts_id"),
        table_name="security_alerts",
    )

    op.drop_table("security_alerts")
