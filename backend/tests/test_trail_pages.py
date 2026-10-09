"""Páginas de ruta de trekking y de sector: se buscan dentro de su lugar."""
import os
import tempfile

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config
from models import ClimbingRoute, ClimbingSector, Route, TrekkingDetail


def test_ruta_dentro_de_su_lugar_aunque_otro_tenga_el_mismo_slug(client, db, make_spot):
    a = make_spot(name="Cerro A", category="Trekking", slug="cerro-a")
    b = make_spot(name="Cerro B", category="Trekking", slug="cerro-b")
    db.add_all([
        Route(spot_id=a.id, name="Al mirador", slug="al-mirador", distance_km=3),
        Route(spot_id=b.id, name="Al mirador", slug="al-mirador", distance_km=8, description="Por la quebrada."),
        TrekkingDetail(spot_id=b.id, bathrooms=True),
    ])
    db.commit()
    r = client.get("/routes/page/cerro-b/al-mirador")
    assert r.status_code == 200, r.text
    data = r.json()
    assert (data["route"]["distance_km"], data["route"]["description"]) == (8, "Por la quebrada.")
    assert (data["spot"]["name"], data["spot"]["slug"]) == ("Cerro B", "cerro-b")
    assert data["spot"]["trekking_detail"]["bathrooms"] is True


def test_ruta_404_si_no_es_de_ese_lugar_o_el_lugar_no_esta_publicado(client, db, make_spot):
    a = make_spot(name="Cerro A", category="Trekking", slug="cerro-a")
    oculto = make_spot(name="Oculto", category="Trekking", slug="oculto", approved=False)
    db.add_all([Route(spot_id=a.id, name="Uno", slug="uno"), Route(spot_id=oculto.id, name="Dos", slug="dos")])
    db.commit()
    assert client.get("/routes/page/cerro-a/dos").status_code == 404
    assert client.get("/routes/page/oculto/dos").status_code == 404


def test_sector_dentro_de_su_lugar_con_sus_vias(client, db, make_spot):
    a = make_spot(name="Arequita", category="Escalada", slug="arequita")
    b = make_spot(name="Salus", category="Escalada", slug="salus")
    sa_ = ClimbingSector(spot_id=a.id, name="Norte", slug="norte")
    sb = ClimbingSector(spot_id=b.id, name="Norte", slug="norte", restrictions="Cerrado en nidificación")
    db.add_all([sa_, sb])
    db.flush()
    db.add_all([
        ClimbingRoute(sector_id=sb.id, name="Fisura", grade="6a"),
        ClimbingRoute(sector_id=sb.id, name="Techo", grade="7b"),
        ClimbingRoute(sector_id=sa_.id, name="Otra", grade="5"),
    ])
    db.commit()
    data = client.get("/sectors/page/salus/norte").json()
    assert data["sector"]["restrictions"] == "Cerrado en nidificación"
    assert (data["sector"]["routes_count"], data["sector"]["min_grade"], data["sector"]["max_grade"]) == (2, "6a", "7b")
    assert [r["name"] for r in data["routes"]] == ["Fisura", "Techo"]
    assert data["spot"]["slug"] == "salus"
    assert client.get("/sectors/page/salus/sur").status_code == 404


def test_la_ruta_trae_el_slug_de_su_lugar(client, db, make_spot):
    spot = make_spot(name="Cerro A", category="Trekking", slug="cerro-a")
    route = Route(spot_id=spot.id, name="Uno", slug="uno")
    db.add(route)
    db.commit()
    assert client.get(f"/routes/{route.id}").json()["spot_slug"] == "cerro-a"


def test_migracion_0018_genera_los_slugs_que_faltan():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0017")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Trekking')"))
            c.execute(text("INSERT INTO spots (id, name, description, department, category_id, is_approved, suggested_by_visitor) VALUES (1, 'X', 'x', 'Rocha', 1, 1, 0)"))
            c.execute(text("INSERT INTO routes (id, spot_id, name, slug, is_approved) VALUES (1, 1, 'Subida al Pan de Azúcar', NULL, 1), (2, 1, 'Ya tiene', 'ya-tiene', 1)"))
            c.execute(text("INSERT INTO climbingsectors (id, spot_id, name, slug, is_approved) VALUES (1, 1, 'Peñón Norte', '', 1)"))
        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            routes = c.execute(text("SELECT slug FROM routes ORDER BY id")).scalars().all()
            sectors = c.execute(text("SELECT slug FROM climbingsectors")).scalars().all()
        engine.dispose()
        assert routes == ["subida-al-pan-de-azucar", "ya-tiene"]
        assert sectors == ["penon-norte"]
    finally:
        os.environ["DATABASE_URL"] = DB_URL
