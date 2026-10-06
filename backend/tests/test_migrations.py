"""Las migraciones y models.py tienen que describir el mismo esquema.

Si alguien cambia un modelo sin generar la migración (o al revés), este test
falla: es lo que antes pasaba en silencio con create_all.
"""
import os

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from conftest import DB_URL, alembic_config
from database import Base


def _fresh_db_url(tmp_path):
    return "sqlite:///" + str(tmp_path / "migrations.db").replace("\\", "/")


def test_upgrade_head_deja_la_base_igual_a_los_modelos(tmp_path):
    url = _fresh_db_url(tmp_path)
    try:
        command.upgrade(alembic_config(url), "head")
        engine = create_engine(url)
        with engine.connect() as conn:
            diffs = compare_metadata(MigrationContext.configure(conn), Base.metadata)
        engine.dispose()
    finally:
        os.environ["DATABASE_URL"] = DB_URL
    assert diffs == [], f"models.py y las migraciones no coinciden; falta una migración: {diffs}"


def test_downgrade_base_deshace_todo(tmp_path):
    url = _fresh_db_url(tmp_path)
    try:
        cfg = alembic_config(url)
        command.upgrade(cfg, "head")
        command.downgrade(cfg, "base")
        engine = create_engine(url)
        tables = set(inspect(engine).get_table_names())
        engine.dispose()
    finally:
        os.environ["DATABASE_URL"] = DB_URL
    assert tables == {"alembic_version"}
