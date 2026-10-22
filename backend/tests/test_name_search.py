"""Buscar lugares por su nombre (text_search.py): el campo "Dónde" del
buscador sugiere lugares (GET /spots/suggest) y filtra por texto (q)."""
import os
import tempfile
from datetime import datetime, timezone

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config
from models import SpotDB
from text_search import normalize, words


def test_normaliza_sin_tildes_ni_mayusculas():
    assert normalize("  Cerro   ARÉQUITA ") == "cerro arequita"
    assert normalize("Río Negro · Ñandú") == "rio negro · nandu"
    assert normalize(None) == ""
    assert words("  Punta  del ESTE ") == ["punta", "del", "este"]


def test_el_nombre_para_buscar_sigue_al_nombre(db, make_spot):
    spot = make_spot(name="Cascada Escondida")
    assert spot.name_search == "cascada escondida"
    spot.name = "Salto del Penitente"
    db.commit()
    db.refresh(spot)
    assert spot.name_search == "salto del penitente"


def names(client, url, **params):
    r = client.get(url, params=params)
    assert r.status_code == 200, r.text
    return sorted(s["name"] for s in r.json())


def test_buscar_por_nombre_en_la_lista_y_en_el_mapa(client, make_spot):
    make_spot(name="Cerro Arequita", slug="cerro-arequita")
    make_spot(name="Arequita Camping", slug="arequita-camping")
    make_spot(name="Río de los Pájaros", slug="rio")
    make_spot(name="50% Natural", slug="cincuenta")
    for url in ("/spots", "/spots/pins"):
        assert names(client, url, q="AREQUITA") == ["Arequita Camping", "Cerro Arequita"]
        assert names(client, url, q="cerro areq") == ["Cerro Arequita"]
        assert names(client, url, q="pajaros rio") == ["Río de los Pájaros"]
        # "%" y "_" se buscan como texto, no como comodines.
        assert names(client, url, q="%") == ["50% Natural"]
        assert names(client, url, q="_") == []


def test_sugerencias_primero_las_que_empiezan_asi_y_hasta_cinco(client, make_spot):
    make_spot(name="Cerro Arequita", slug="cerro-arequita", department="Lavalleja")
    make_spot(name="Arequita Camping", slug="arequita-camping")
    for i in range(6):
        make_spot(name=f"Playa {i}", slug=f"playa-{i}")
    make_spot(name="Playa Escondida", slug="escondida", approved=False)
    make_spot(name="Playa Borrada", slug="borrada", owner_deleted_at=datetime.now(timezone.utc))

    found = client.get("/spots/suggest", params={"q": "aréquita"}).json()
    assert [s["name"] for s in found] == ["Arequita Camping", "Cerro Arequita"]
    assert found[1] == {"id": found[1]["id"], "name": "Cerro Arequita", "slug": "cerro-arequita", "department": "Lavalleja", "category": "Camping"}

    # "Alto del Cerro" va antes en orden alfabético, pero "Cerro Chato" empieza así.
    make_spot(name="Alto del Cerro", slug="alto")
    make_spot(name="Cerro Chato", slug="chato")
    assert [s["name"] for s in client.get("/spots/suggest", params={"q": "cerro"}).json()] == ["Cerro Arequita", "Cerro Chato", "Alto del Cerro"]

    playas = [s["name"] for s in client.get("/spots/suggest", params={"q": "playa"}).json()]
    assert playas == ["Playa 0", "Playa 1", "Playa 2", "Playa 3", "Playa 4"]


def test_sugerencias_piden_al_menos_dos_letras(client):
    assert client.get("/spots/suggest", params={"q": "a"}).status_code == 422
    assert client.get("/spots/suggest", params={"q": "  "}).json() == []


def test_migracion_0026_completa_el_nombre_para_buscar():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0025")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Camping')"))
            c.execute(text("INSERT INTO spots (id, name, description, department, category_id, is_approved, suggested_by_visitor) VALUES (1, 'Laguna  de Rocha', 'x', 'Rocha', 1, 1, 0)"))
        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            assert c.execute(text("SELECT name_search FROM spots")).scalar() == "laguna de rocha"
        engine.dispose()
    finally:
        os.environ["DATABASE_URL"] = DB_URL


def test_el_modelo_tiene_la_columna():
    assert "name_search" in SpotDB.__table__.columns
