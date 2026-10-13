"""Playas y lagunas (lugares públicos del admin) y escuelas de surf / kayak
(lugares con dueño propio): ownership.is_public_venue."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user
from models import Category, KayakServiceDetail, SpotDB, SurfDetail

THIRD = "operador@test.com"


@pytest.fixture
def beach(make_spot):
    """Playa aprobada. Quien la cargó (OWNER) todavía figura como dueño:
    así estaban antes los datos; la regla igual no lo deja editarla."""
    return make_spot(name="Playa Brava", category="Surf")


# -------- La playa --------

def test_quien_cargo_una_playa_aprobada_ya_no_la_edita(client, beach):
    r = client.patch(f"/admin/spots/{beach.id}", json={"price": 10}, headers=as_user(OWNER))
    assert r.status_code == 403


def test_el_admin_si_edita_la_playa(client, beach):
    assert client.patch(f"/admin/spots/{beach.id}", json={"price": 10}, headers=as_user(ADMIN)).status_code == 200


def test_mientras_esta_en_revision_la_maneja_quien_la_sugirio(client, make_spot):
    beach = make_spot(name="Playa Nueva", category="Surf", approved=False)
    assert client.patch(f"/admin/spots/{beach.id}", json={"price": 10}, headers=as_user(OWNER)).status_code == 200
    r = client.get(f"/spots/{beach.id}/can-upload", params={"public_id": f"{beach.id}/{1:016x}"}, headers=as_user(OWNER))
    assert r.status_code == 200


def test_aprobar_una_playa_la_pasa_al_admin(client, db, make_spot):
    beach = make_spot(name="Playa Nueva", category="Surf", approved=False)
    client.patch(f"/admin/spots/{beach.id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    db.expire_all()
    assert db.get(SpotDB, beach.id).owner_email == ADMIN


def test_aprobar_un_lugar_comun_no_cambia_el_duenio(client, db, make_spot):
    spot = make_spot(approved=False)
    client.patch(f"/admin/spots/{spot.id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    db.expire_all()
    assert db.get(SpotDB, spot.id).owner_email == OWNER


def test_una_playa_aprobada_no_figura_en_tus_lugares(client, beach, make_spot):
    make_spot(name="Mi camping")
    names = [s["name"] for s in client.get("/spots/mine", headers=as_user(OWNER)).json()]
    assert names == ["Mi camping"]


def test_nadie_mas_sube_fotos_a_una_playa(client, beach):
    # Antes las escuelas guardaban sus fotos en la carpeta de la playa; ahora
    # cada escuela es un lugar y sube las suyas.
    r = client.get(f"/spots/{beach.id}/can-upload", params={"public_id": f"{beach.id}/{1:016x}"}, headers=as_user(THIRD))
    assert r.status_code == 403


# -------- Escuelas con dueño propio --------

@pytest.mark.parametrize("category,detail", [("Surf", SurfDetail), ("Kayak", KayakServiceDetail)])
def test_aprobar_una_escuela_no_la_pasa_al_admin(client, db, make_spot, category, detail):
    school = make_spot(name="Escuela Ola", category=category, approved=False, owner=THIRD)
    db.add(detail(spot_id=school.id))
    db.commit()
    client.patch(f"/admin/spots/{school.id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    db.expire_all()
    assert db.get(SpotDB, school.id).owner_email == THIRD
    assert client.patch(f"/admin/spots/{school.id}", json={"price": 10}, headers=as_user(THIRD)).status_code == 200
    assert [s["name"] for s in client.get("/spots/mine", headers=as_user(THIRD)).json()] == ["Escuela Ola"]


# -------- Lugares sugeridos por un visitante (no el responsable) --------

@pytest.fixture
def camping(db):
    category = Category(name="Camping")
    db.add(category)
    db.commit()
    return category


@pytest.fixture
def _create(client, camping):
    def create(_client, user, **extra):
        body = {"name": "Camping del Arroyo", "description": "Lindo", "department": "Rocha", "category_id": camping.id, **extra}
        return client.post("/spots", json=body, headers=as_user(user))
    return create


def test_por_defecto_quien_lo_carga_es_el_responsable(client, db, _create):
    spot_id = _create(client, OWNER).json()["id"]
    client.patch(f"/admin/spots/{spot_id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    db.expire_all()
    spot = db.get(SpotDB, spot_id)
    assert spot.suggested_by_visitor is False
    assert spot.owner_email == OWNER


def test_sugerido_por_un_visitante_mientras_se_revisa_lo_maneja_quien_lo_cargo(client, _create):
    spot_id = _create(client, OTHER, is_responsible=False).json()["id"]
    assert client.patch(f"/admin/spots/{spot_id}", json={"price": 10}, headers=as_user(OTHER)).status_code == 200
    r = client.get(f"/spots/{spot_id}/can-upload", params={"public_id": f"{spot_id}/{1:016x}"}, headers=as_user(OTHER))
    assert r.status_code == 200


def test_sugerido_por_un_visitante_al_aprobarse_pasa_al_admin(client, db, _create):
    spot_id = _create(client, OTHER, is_responsible=False).json()["id"]
    client.patch(f"/admin/spots/{spot_id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    db.expire_all()
    assert db.get(SpotDB, spot_id).owner_email == ADMIN
    assert client.patch(f"/admin/spots/{spot_id}", json={"price": 10}, headers=as_user(OTHER)).status_code == 403
    assert client.get("/spots/mine", headers=as_user(OTHER)).json() == []


def test_al_visitante_le_llega_el_aviso_de_que_se_publico(client, db, _create):
    spot_id = _create(client, OTHER, is_responsible=False).json()["id"]
    client.patch(f"/admin/spots/{spot_id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    titles = [n["title"] for n in client.get("/notifications/", headers=as_user(OTHER)).json()["items"]]
    assert titles == ["Se publicó «Camping del Arroyo», el lugar que sugeriste"]


def test_el_admin_ve_quien_lo_sugirio_como_visitante(client, _create):
    _create(client, OTHER, is_responsible=False)
    spots = client.get("/admin/spots", headers=as_user(ADMIN)).json()
    assert [s["suggested_by_visitor"] for s in spots] == [True]
