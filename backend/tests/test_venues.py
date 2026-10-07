"""Playas y lagunas (lugares públicos del admin) y escuelas de surf / kayak
con dueño propio (ownership.is_public_venue, operators.py)."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import Category, Contribution, KayakDetail, SpotDB, SurfSchool

THIRD = "operador@test.com"


def photo(spot_id, n=1, host="https://res.cloudinary.com/demo"):
    return f"{host}/image/upload/v1/rumbo/spots/{spot_id}/{n:016x}.jpg"


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


def test_cualquiera_sube_fotos_de_su_escuela_a_una_playa(client, beach, make_spot):
    r = client.get(f"/spots/{beach.id}/can-upload", params={"public_id": f"{beach.id}/{1:016x}"}, headers=as_user(THIRD))
    assert r.status_code == 200
    camping = make_spot(name="Ajeno")
    r = client.get(f"/spots/{camping.id}/can-upload", params={"public_id": f"{camping.id}/{1:016x}"}, headers=as_user(THIRD))
    assert r.status_code == 403


# -------- Escuelas con dueño propio --------

def test_cualquiera_suma_su_escuela_a_una_playa_y_queda_de_el(client, db, beach):
    r = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Escuela Ola", "photo_1": photo(beach.id)}, headers=as_user(THIRD))
    assert r.status_code == 200, r.text
    assert r.json()["is_approved"] is False
    school = every(db, SurfSchool).one()
    assert school.owner_email == THIRD
    assert db.query(Contribution).one().author_email == THIRD


def test_escuela_en_una_playa_recien_sugerida_queda_en_revision(client, make_spot):
    beach = make_spot(name="Playa Nueva", category="Surf", approved=False)
    r = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Escuela"}, headers=as_user(OWNER))
    assert r.status_code == 200
    assert r.json()["is_approved"] is False


def test_el_admin_suma_escuelas_directo(client, beach):
    r = client.post("/kayak/", json={"spot_id": beach.id, "name": "Kayak"}, headers=as_user(ADMIN))
    assert r.json()["is_approved"] is True


def test_en_un_lugar_comun_sigue_la_regla_del_duenio(client, make_spot):
    camping = make_spot()
    assert client.post("/surfschool/", json={"spot_id": camping.id, "name": "x"}, headers=as_user(THIRD)).status_code == 403


@pytest.mark.parametrize("url", [
    "https://otro-sitio.com/foto.jpg",                               # no es Cloudinary
    photo(999),                                                      # carpeta de otra playa
    "https://res.cloudinary.com/demo/image/upload/v1/Surf/Ola/Ola1.jpg",  # formato viejo
])
def test_las_fotos_tienen_que_ser_de_esa_playa(client, beach, url):
    r = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Ola", "photo_1": url}, headers=as_user(THIRD))
    assert r.status_code == 400


def test_la_borra_su_duenio_y_no_quien_cargo_la_playa(client, db, beach):
    school_id = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Ola"}, headers=as_user(THIRD)).json()["id"]
    assert client.delete(f"/surfschool/{school_id}", headers=as_user(OWNER)).status_code == 403
    assert client.delete(f"/surfschool/{school_id}", headers=as_user(OTHER)).status_code == 403
    assert client.delete(f"/surfschool/{school_id}", headers=as_user(THIRD)).status_code == 200


def test_una_escuela_no_se_ve_si_su_playa_no_esta_publicada(client, db, make_spot):
    beach = make_spot(name="Playa Nueva", category="Surf", approved=False)
    school = SurfSchool(spot_id=beach.id, name="Aprobada pero sin playa")
    db.add(school)
    db.commit()
    assert client.get("/surfschool/").json() == []
    assert client.get("/surfschool/ids").json() == []
    assert client.get(f"/surfschool/{school.id}").status_code == 404


def test_con_la_playa_publicada_si_se_ve(client, db, beach):
    db.add(KayakDetail(spot_id=beach.id, name="Kayak Brava"))
    db.commit()
    assert [k["name"] for k in client.get("/kayak/").json()] == ["Kayak Brava"]


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
