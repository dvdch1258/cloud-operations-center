"""Exercise the actual migration against existing data with foreign keys enabled."""
import importlib.util
from datetime import datetime
from pathlib import Path

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


def test_migration_backfills_known_events_preserves_links_and_downgrades():
    path = Path(__file__).parents[1] / "alembic/versions/d6e4b82a190f_add_incident_timeline.py"
    spec = importlib.util.spec_from_file_location("incident_timeline_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite://")
    metadata = sa.MetaData()
    sa.Table("users", metadata, sa.Column("id", sa.Integer, primary_key=True))
    incidents = sa.Table("incidents", metadata,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("created_at", sa.DateTime), sa.Column("resolved_at", sa.DateTime))
    executions = sa.Table("automation_executions", metadata,
        sa.Column("id", sa.Integer, primary_key=True), sa.Column("rule_name", sa.String(100)))
    with engine.begin() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
        metadata.create_all(connection)
        created = datetime(2026, 8, 31, 10, 0)
        resolved = datetime(2026, 8, 31, 11, 0)
        connection.execute(incidents.insert(), [
            {"id": 1, "created_at": created, "resolved_at": resolved},
            {"id": 2, "created_at": created, "resolved_at": None},
        ])
        connection.execute(executions.insert(), {"id": 1, "rule_name": "Existing execution"})
        migration.op = Operations(MigrationContext.configure(connection))
        migration.upgrade()
        events = sa.Table("incident_events", sa.MetaData(), autoload_with=connection)
        rows = connection.execute(sa.select(events).order_by(events.c.incident_id, events.c.occurred_at)).mappings().all()
        assert [(row["incident_id"], row["event_type"], row["occurred_at"]) for row in rows] == [
            (1, "created", created), (1, "resolved", resolved), (2, "created", created),
        ]
        assert all(row["source"] == "legacy" and row["actor_user_id"] is None
                   and row["trace_id"] is None and row["changes"] is None for row in rows)
        assert connection.exec_driver_sql("SELECT incident_id FROM automation_executions").scalar() is None
        connection.exec_driver_sql("UPDATE automation_executions SET incident_id=1")
        connection.execute(incidents.delete().where(incidents.c.id == 1))
        assert connection.exec_driver_sql("SELECT incident_id FROM automation_executions").scalar() is None
        assert connection.execute(sa.select(sa.func.count()).select_from(events)).scalar() == 1
        migration.downgrade()
        inspector = sa.inspect(connection)
        assert "incident_events" not in inspector.get_table_names()
        assert "incident_id" not in {c["name"] for c in inspector.get_columns("automation_executions")}
        assert connection.exec_driver_sql("SELECT rule_name FROM automation_executions").scalar() == "Existing execution"
        assert connection.execute(sa.select(incidents.c.id)).scalars().all() == [2]
