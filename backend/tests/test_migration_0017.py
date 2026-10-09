"""La migración 0017 pasa a "no sé" el alquiler de kayak guardado como "no"
por el default viejo (no se distingue de un "no sé"); los "sí" quedan."""
import os
import tempfile

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config


def test_alquiler_no_pasa_a_no_se_y_si_queda():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0016")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Kayak')"))
            c.execute(text(
                "INSERT INTO spots (id, name, description, department, category_id, is_approved, suggested_by_visitor) "
                "VALUES (1, 'Laguna', 'x', 'Rocha', 1, 1, 0)"))
            for kid, rental in ((1, True), (2, False), (3, None)):
                c.execute(text("INSERT INTO kayak_details (id, spot_id, name, rental_available, is_approved) VALUES (:id, 1, 'K', :r, 1)"),
                          {"id": kid, "r": rental})

        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            rows = c.execute(text("SELECT id, rental_available FROM kayak_details ORDER BY id")).all()
        engine.dispose()
        assert [tuple(r) for r in rows] == [(1, 1), (2, None), (3, None)]
    finally:
        os.environ["DATABASE_URL"] = DB_URL
