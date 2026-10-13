"""La migración 0022 borra las tablas del sistema viejo de escuelas de surf
y servicios de kayak (sus datos ya los pasó 0021 a lugares)."""
import os
import tempfile

from alembic import command
from sqlalchemy import create_engine, inspect

from conftest import DB_URL, alembic_config

OLD_TABLES = {"surf_beach", "kayak_details", "surf_reviews", "kayak_reviews", "operator_change_requests"}


def test_borra_las_tablas_viejas_y_el_downgrade_las_vuelve_a_crear():
    url = f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'mig.db')}"
    config = alembic_config(url)
    try:
        command.upgrade(config, "0021")
        engine = create_engine(url)
        assert OLD_TABLES <= set(inspect(engine).get_table_names())

        command.upgrade(config, "0022")
        tables = set(inspect(engine).get_table_names())
        assert not OLD_TABLES & tables
        # Lo nuevo queda.
        assert {"surf_details", "kayak_service_details", "spots", "reviews"} <= tables

        command.downgrade(config, "0021")
        assert OLD_TABLES <= set(inspect(engine).get_table_names())
        engine.dispose()
    finally:
        os.environ["DATABASE_URL"] = DB_URL
