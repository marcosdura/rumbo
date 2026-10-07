"""La migración 0013 copia mascotas y señal de donde estaban (trekking,
glamping, el amenity del camping) a las columnas nuevas de spots."""
import os
import tempfile

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config


def test_copia_mascotas_y_senial_a_los_lugares():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0012")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Trekking')"))
            for spot_id in (1, 2, 3, 4):
                c.execute(text(
                    "INSERT INTO spots (id, name, description, department, category_id, is_approved, suggested_by_visitor) "
                    "VALUES (:id, :name, 'x', 'Rocha', 1, 1, 0)"), {"id": spot_id, "name": f"Lugar {spot_id}"})
            # 1: trekking con mascotas no y señal sí
            c.execute(text("INSERT INTO trekking_details (spot_id, pet_friendly, signal) VALUES (1, 0, 1)"))
            # 2: glamping con mascotas sí
            c.execute(text("INSERT INTO glamping_amenities (spot_id, pet_friendly) VALUES (2, 1)"))
            # 3: camping con el amenity "Acepta mascotas"
            c.execute(text("INSERT INTO amenities (id, name) VALUES (23, 'Acepta mascotas')"))
            c.execute(text("INSERT INTO spot_amenities (spot_id, amenity_id) VALUES (3, 23)"))
            # 4: nada

        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            rows = c.execute(text("SELECT id, pets_allowed, cell_signal, reservation_required FROM spots ORDER BY id")).all()
        engine.dispose()
        assert [tuple(r) for r in rows] == [
            (1, 0, 1, None),
            (2, 1, None, None),
            (3, 1, None, None),
            (4, None, None, None),
        ]
    finally:
        # alembic_config deja DATABASE_URL apuntando a esta base: se vuelve a
        # la de los tests.
        os.environ["DATABASE_URL"] = DB_URL
