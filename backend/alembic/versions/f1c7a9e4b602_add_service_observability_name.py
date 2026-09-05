"""add service observability name

Revision ID: f1c7a9e4b602
Revises: d6e4b82a190f
"""

from alembic import op
import sqlalchemy as sa


revision = "f1c7a9e4b602"
down_revision = "d6e4b82a190f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "services",
        sa.Column(
            "observability_name",
            sa.String(),
            nullable=True,
        ),
    )

    # Existing production backend telemetry is
    # instrumented with this OTEL service.name.
    # Keep the migration conservative: only the
    # known Backend API endpoint is backfilled.
    op.execute(
        """
        UPDATE services
        SET observability_name =
            'cloud-operations-backend'
        WHERE observability_name IS NULL
          AND name = 'Backend API'
          AND endpoint LIKE
              '%backend.cloud-ops.svc.cluster.local%'
        """
    )


def downgrade():
    op.drop_column(
        "services",
        "observability_name",
    )
