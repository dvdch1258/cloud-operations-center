"""allow service deletion while preserving incidents

Revision ID: f4c8d2a71e90
Revises: b3f7c2d91a64
"""

from alembic import op
import sqlalchemy as sa


revision = "f4c8d2a71e90"
down_revision = "b3f7c2d91a64"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "incidents_service_id_fkey",
        "incidents",
        type_="foreignkey",
    )

    op.alter_column(
        "incidents",
        "service_id",
        existing_type=sa.Integer(),
        nullable=True,
    )

    op.create_foreign_key(
        "incidents_service_id_fkey",
        "incidents",
        "services",
        ["service_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "incidents_service_id_fkey",
        "incidents",
        type_="foreignkey",
    )

    null_count = op.get_bind().execute(
        sa.text(
            "SELECT COUNT(*) "
            "FROM incidents "
            "WHERE service_id IS NULL"
        )
    ).scalar_one()

    if null_count:
        raise RuntimeError(
            "Cannot downgrade while incidents with "
            "service_id=NULL exist"
        )

    op.alter_column(
        "incidents",
        "service_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.create_foreign_key(
        "incidents_service_id_fkey",
        "incidents",
        "services",
        ["service_id"],
        ["id"],
    )
