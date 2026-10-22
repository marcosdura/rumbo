"""Lo de un lugar que no se ve en público (en revisión, rechazado o de una
cuenta borrada) tampoco se lee por id: rutas y sectores daban 200 con todo
lo suyo. Y las lecturas que nadie usaba ya no existen."""
from datetime import datetime, timezone

import pytest

from models import ClimbingSector, Route


@pytest.fixture
def places(db, make_spot):
    """Un lugar publicado, uno en revisión y uno de una cuenta borrada, cada
    uno con una ruta y un sector aprobados."""
    out = {}
    for key, kwargs in {
        "ok": {},
        "pending": {"approved": False},
        "deleted": {"owner_deleted_at": datetime(2026, 1, 1, tzinfo=timezone.utc)},
    }.items():
        spot = make_spot(name=f"Lugar {key}", **kwargs)
        route = Route(spot_id=spot.id, name=f"Ruta {key}", difficulty="fácil", slug=f"ruta-{key}")
        sector = ClimbingSector(spot_id=spot.id, name=f"Sector {key}", type="deportiva", slug=f"sector-{key}")
        db.add_all([route, sector])
        db.commit()
        out[key] = {"spot": spot.id, "route": route.id, "sector": sector.id}
    return out


@pytest.mark.parametrize("key", ["pending", "deleted"])
def test_la_ruta_de_un_lugar_no_publicado_da_404(client, places, key):
    assert client.get(f"/routes/{places[key]['route']}").status_code == 404


@pytest.mark.parametrize("key", ["pending", "deleted"])
def test_el_sector_de_un_lugar_no_publicado_da_404(client, places, key):
    assert client.get(f"/sectors/{places[key]['sector']}").status_code == 404


def test_los_de_un_lugar_publicado_si(client, places):
    # Control: no es que ahora todo da 404.
    assert client.get(f"/routes/{places['ok']['route']}").json()["name"] == "Ruta ok"
    assert client.get(f"/sectors/{places['ok']['sector']}").json()["name"] == "Sector ok"


def test_la_lista_de_sectores_solo_trae_los_de_lugares_publicados(client, places):
    assert [s["name"] for s in client.get("/sectors/").json()] == ["Sector ok"]
    for key in ("pending", "deleted"):
        assert client.get("/sectors/", params={"spot_id": places[key]["spot"]}).json() == [], key
    assert [s["name"] for s in client.get("/sectors/", params={"spot_id": places["ok"]["spot"]}).json()] == ["Sector ok"]


@pytest.mark.parametrize("path", [
    "/spots/{spot}/routes",
    "/spots/{spot}/sectors",
    "/spots/{spot}/experiences",
    "/glamping/spots/{spot}/glamping",
    "/glamping/spots/{spot}/amenities",
    "/routes/",
    "/routes/by-slug/ruta-pending",
    "/sectors/by-slug/sector-pending",
    "/sectors/{sector}/routes",
])
def test_las_lecturas_sin_uso_ya_no_existen(client, places, path):
    # Nadie las usaba y mostraban lo de lugares no publicados.
    assert client.get(path.format(**places["pending"])).status_code in (404, 405), path
