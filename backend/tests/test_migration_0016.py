"""La migración 0016 copia el precio del camping al lugar cuando el lugar no
tenía precio propio."""
import os
import tempfile

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config


def test_copia_el_precio_del_camping_si_el_lugar_no_tenia():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0015")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Camping')"))
            # 1: sin precio, camping 450.4; 2: precio propio 900, camping 200;
            # 3: sin precio, camping sin precio
            for spot_id, price in ((1, None), (2, 900), (3, None)):
                c.execute(text(
                    "INSERT INTO spots (id, name, description, department, category_id, price, is_approved, suggested_by_visitor) "
                    "VALUES (:id, :name, 'x', 'Rocha', 1, :price, 1, 0)"), {"id": spot_id, "name": f"Lugar {spot_id}", "price": price})
            c.execute(text("INSERT INTO camping_details (spot_id, price) VALUES (1, 450.4), (2, 200), (3, NULL)"))

        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            rows = c.execute(text("SELECT id, price FROM spots ORDER BY id")).all()
        engine.dispose()
        assert [tuple(r) for r in rows] == [(1, 450), (2, 900), (3, None)]
    finally:
        os.environ["DATABASE_URL"] = DB_URL
