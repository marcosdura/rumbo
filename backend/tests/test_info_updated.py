"""La "Última actualización" de un lugar (models.touch_spot_info): cambia
con su información pública, no con la moderación, las reseñas ni lo que
está en revisión."""
import os
import tempfile
from datetime import datetime, timedelta, timezone

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config
from models import ClimbingRoute, ClimbingSector, Review, Route, SpotDB, User

OLD = datetime(2026, 1, 1, tzinfo=timezone.utc)


def aged(db, spot):
    """El lugar con su fecha vieja, para ver si algo la mueve."""
    db.query(SpotDB).filter(SpotDB.id == spot.id).update({SpotDB.info_updated_at: OLD})
    db.commit()
    db.expire_all()


def updated(db, spot) -> bool:
    db.expire_all()
    value = db.get(SpotDB, spot.id).info_updated_at
    return value.replace(tzinfo=timezone.utc) > OLD + timedelta(days=1)


def test_un_lugar_nuevo_arranca_con_fecha(db, make_spot):
    spot = make_spot()
    assert spot.info_updated_at is not None


def test_cambiar_sus_datos_la_mueve_y_la_moderacion_no(db, make_spot):
    spot = make_spot()
    aged(db, spot)
    spot = db.get(SpotDB, spot.id)
    spot.rejection_reason = "Faltan fotos"
    spot.owner_deleted_at = datetime.now(timezone.utc)
    db.commit()
    assert not updated(db, spot)

    spot = db.get(SpotDB, spot.id)
    spot.price = 500
    db.commit()
    assert updated(db, spot)


def test_lo_que_esta_en_revision_no_cuenta_hasta_aprobarse(db, make_spot):
    spot = make_spot(category="Trekking")
    aged(db, spot)
    route = Route(spot_id=spot.id, name="Nueva", slug="nueva", is_approved=False)
    db.add(route)
    db.commit()
    assert not updated(db, spot)

    route.is_approved = True
    db.commit()
    assert updated(db, spot)


def test_una_via_nueva_mueve_la_fecha_de_su_lugar(db, make_spot):
    spot = make_spot(category="Escalada")
    sector = ClimbingSector(spot_id=spot.id, name="Norte", slug="norte")
    db.add(sector)
    db.commit()
    aged(db, spot)
    db.add(ClimbingRoute(sector_id=sector.id, name="La Diagonal", grade="6a"))
    db.commit()
    assert updated(db, spot)


def test_borrar_una_ruta_publicada_tambien_es_un_cambio(db, make_spot):
    spot = make_spot(category="Trekking")
    route = Route(spot_id=spot.id, name="Vieja", slug="vieja")
    db.add(route)
    db.commit()
    aged(db, spot)
    db.delete(db.get(Route, route.id))
    db.commit()
    assert updated(db, spot)


def test_una_resena_no_es_un_cambio_de_informacion(db, make_spot):
    spot = make_spot()
    aged(db, spot)
    db.add(User(id="u@test.com", email="u@test.com"))
    db.flush()
    db.add(Review(spot_id=spot.id, user_id="u@test.com", rating=5))
    db.commit()
    assert not updated(db, spot)


def test_la_pagina_del_lugar_trae_la_fecha(client, db, make_spot):
    spot = make_spot(slug="cascada")
    aged(db, spot)
    assert client.get("/spots/by-slug/cascada").json()["info_updated_at"].startswith("2026-01-01")


def test_migracion_0024_arranca_con_la_fecha_de_creacion():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0023")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Camping')"))
            c.execute(text("INSERT INTO spots (id, name, description, department, category_id, is_approved, suggested_by_visitor, created_at) VALUES (1, 'X', 'x', 'Rocha', 1, 1, 0, '2025-05-04 10:00:00')"))
        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            value = c.execute(text("SELECT info_updated_at FROM spots")).scalar()
        engine.dispose()
        assert str(value).startswith("2025-05-04 10:00:00")
    finally:
        os.environ["DATABASE_URL"] = DB_URL
