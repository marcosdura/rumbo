"""Ninguna lectura pública muestra un aporte pendiente.

El filtro es global (models.hide_pending_contributions): este archivo
recorre cada endpoint que lee experiencias, glamping, rutas, sectores o
vías. Los aprobados se llaman "VISIBLE ..." y los pendientes
"PENDIENTE ...", así cada test busca la palabra en la respuesta.
"""
import pytest

from conftest import OTHER
from models import (
    Category, ClimbingRoute, ClimbingSector, Experience, GlampingDetail,
    Route, SpotCategory,
)


@pytest.fixture
def world(db, make_spot):
    """Un spot aprobado con un elemento aprobado y uno pendiente de cada tipo,
    y otro spot sin nada aprobado."""
    spot = make_spot(name="Playa Brava")
    solo_pendiente = make_spot(name="Solo Pendiente", owner=OTHER)
    category = db.query(Category).first()
    # Los filtros de búsqueda se aplican junto con activity=<categoría>.
    for name in ["Surf", "Kayak", "Trekking", "Escalada"]:
        cat = Category(name=name)
        db.add(cat)
        db.flush()
        db.add(SpotCategory(spot_id=spot.id, category_id=cat.id, is_primary=False))
        db.add(SpotCategory(spot_id=solo_pendiente.id, category_id=cat.id, is_primary=False))

    sector_ok = ClimbingSector(spot_id=spot.id, name="VISIBLE sector", type="deportiva", slug="sector-visible")
    sector_pending = ClimbingSector(spot_id=spot.id, name="PENDIENTE sector", type="boulder", slug="sector-pendiente", is_approved=False)
    route_ok = Route(spot_id=spot.id, name="VISIBLE ruta", difficulty="fácil", slug="ruta-visible")
    route_pending = Route(spot_id=spot.id, name="PENDIENTE ruta", difficulty="difícil", slug="ruta-pendiente", is_approved=False)
    db.add_all([
        sector_ok, sector_pending, route_ok, route_pending,
        Experience(spot_id=spot.id, category_id=category.id, title="VISIBLE experiencia"),
        Experience(spot_id=spot.id, category_id=category.id, title="PENDIENTE experiencia", is_approved=False),
        GlampingDetail(spot_id=spot.id, accommodation_type="VISIBLE domo"),
        GlampingDetail(spot_id=spot.id, accommodation_type="PENDIENTE domo", is_approved=False),
    ])
    db.flush()
    db.add_all([
        ClimbingRoute(sector_id=sector_ok.id, name="VISIBLE vía", grade="5a"),
        # Vía pendiente en un sector aprobado: no puede cambiar sus stats.
        ClimbingRoute(sector_id=sector_ok.id, name="PENDIENTE vía", grade="8a", is_approved=False),
        ClimbingRoute(sector_id=sector_pending.id, name="PENDIENTE vía del sector", grade="6a", is_approved=False),
    ])
    db.commit()
    return {
        "spot": spot, "solo_pendiente": solo_pendiente,
        "sector_ok": sector_ok.id, "sector_pending": sector_pending.id,
        "route_pending": route_pending.id,
    }


def lists(world):
    sid = world["spot"].id
    return [
        "/spots/by-slug/playa-brava",
        f"/spots/{sid}",
        f"/spots/{sid}/routes",
        f"/spots/{sid}/sectors",
        f"/spots/{sid}/experiences",
        f"/glamping/spots/{sid}/glamping",
        "/routes/",
        f"/sectors/?spot_id={sid}",
        f"/sectors/{world['sector_ok']}",
        f"/sectors/{world['sector_ok']}/routes",
        "/sectors/by-slug/sector-visible",
        "/spots",
        "/spots/pins",
    ]


def test_ninguna_lectura_publica_muestra_pendientes(client, world):
    for url in lists(world):
        r = client.get(url)
        assert r.status_code == 200, (url, r.status_code, r.text)
        assert "PENDIENTE" not in r.text, url


def test_el_spot_si_muestra_lo_aprobado(client, world):
    body = client.get("/spots/by-slug/playa-brava").text
    for name in ["VISIBLE sector", "VISIBLE ruta", "VISIBLE experiencia", "VISIBLE domo"]:
        assert name in body, name


def test_una_via_pendiente_no_cambia_las_stats_del_sector(client, world):
    sector = client.get(f"/sectors/{world['sector_ok']}").json()
    assert sector["routes_count"] == 1
    assert sector["max_grade"] == "5a"


@pytest.mark.parametrize("path", [
    "/routes/{route_pending}",
    "/routes/by-slug/ruta-pendiente",
    "/sectors/{sector_pending}",
    "/sectors/{sector_pending}/routes",
    "/sectors/by-slug/sector-pendiente",
])
def test_el_detalle_de_un_pendiente_da_404(client, world, path):
    assert client.get(path.format(**world)).status_code == 404


def test_un_id_que_no_existe_da_404_y_no_500(client):
    assert client.get("/routes/999").status_code == 404


@pytest.mark.parametrize("params", [
    {"activity": "Trekking", "difficulty": "difícil"},      # solo la ruta pendiente es difícil
    {"activity": "Escalada", "climbing_type": "boulder"},   # solo el sector pendiente es boulder
    {"activity": "Escalada", "grade_range": "experto"},     # solo la vía pendiente es 8a
])
def test_los_filtros_de_busqueda_ignoran_pendientes(client, world, params):
    r = client.get("/spots", params=params)
    assert r.status_code == 200
    assert r.json() == [], params


@pytest.mark.parametrize("params", [
    {"activity": "Trekking", "difficulty": "fácil"},
    {"activity": "Escalada", "climbing_type": "deportiva"},
    {"activity": "Escalada", "grade_range": "principiante"},
])
def test_los_filtros_si_encuentran_lo_aprobado(client, world, params):
    # Control del test anterior: el filtro funciona, no es que nunca matchea.
    ids = [s["id"] for s in client.get("/spots", params=params).json()]
    assert world["spot"].id in ids, params


# Surf y kayak: las escuelas y servicios son lugares (una en revisión es un
# lugar en revisión): ver test_search_surf_kayak.py.


def test_el_sector_dice_de_que_lugar_es(client, world):
    assert client.get(f"/sectors/{world['sector_ok']}").json()["spot_id"] == world["spot"].id
