"""Importar vías desde una planilla (solo el admin): crea las nuevas y
actualiza las repetidas con los datos que vienen."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import ClimbingRoute, ClimbingSector


@pytest.fixture
def sector(db, make_spot):
    spot = make_spot(name="Roca", category="Escalada")
    s = ClimbingSector(spot_id=spot.id, name="Norte", slug="norte")
    db.add(s)
    db.commit()
    return s


def post(client, sector_id, routes, user=ADMIN):
    return client.post(f"/sectors/{sector_id}/routes/import", json={"routes": routes}, headers=as_user(user))


def test_solo_el_admin(client, sector):
    rows = [{"name": "La Diagonal"}]
    assert post(client, sector.id, rows, user=OWNER).status_code == 403
    assert post(client, sector.id, rows, user=OTHER).status_code == 403
    assert client.post(f"/sectors/{sector.id}/routes/import", json={"routes": rows}).status_code in (401, 403)


def test_crea_las_nuevas_publicadas(client, db, sector):
    r = post(client, sector.id, [
        {"name": "La Diagonal", "grade": "6a", "type": "deportiva", "length": 25, "bolts": 9, "description": "Placa"},
        {"name": "El Techo", "grade": "7b+"},
    ])
    assert r.status_code == 200, r.text
    assert r.json() == {"created": 2, "updated": 0}
    routes = {x.name: x for x in every(db, ClimbingRoute)}
    assert (routes["La Diagonal"].grade, routes["La Diagonal"].bolts, routes["La Diagonal"].is_approved) == ("6a", 9, True)


def test_la_repetida_se_actualiza_y_lo_vacio_no_borra(client, db, sector):
    db.add(ClimbingRoute(sector_id=sector.id, name="La Diagonal", grade="6a", bolts=8, description="Vieja"))
    db.commit()
    r = post(client, sector.id, [{"name": "  la   DIAGONAL ", "grade": "6b", "length": 30}])
    assert r.json() == {"created": 0, "updated": 1}
    db.expire_all()
    [route] = every(db, ClimbingRoute)
    assert (route.name, route.grade, route.length, route.bolts, route.description) == ("La Diagonal", "6b", 30, 8, "Vieja")


def test_repetida_dentro_del_archivo_cuenta_una_vez(client, db, sector):
    r = post(client, sector.id, [{"name": "Uno", "grade": "5"}, {"name": "uno", "grade": "5+"}])
    assert r.json() == {"created": 1, "updated": 1}
    assert [x.grade for x in every(db, ClimbingRoute)] == ["5+"]


@pytest.mark.parametrize("row", [
    {"name": ""}, {"name": "   "}, {"name": "x" * 201},
    {"name": "A", "grade": "11z"}, {"name": "A", "grade": "V5"},
    {"name": "A", "type": "escalera"}, {"name": "A", "bolts": -1}, {"name": "A", "length": 0},
])
def test_valida_cada_fila(client, db, sector, row):
    assert post(client, sector.id, [row]).status_code == 422
    assert every(db, ClimbingRoute).count() == 0


def test_limites(client, sector):
    assert post(client, sector.id, []).status_code == 422
    assert post(client, sector.id, [{"name": f"V{i}"} for i in range(501)]).status_code == 422
    assert post(client, 9999, [{"name": "A"}]).status_code == 404
