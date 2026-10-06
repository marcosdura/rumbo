"""Catálogo global y categorías secundarias: solo el admin (o el dueño
mientras su spot no está aprobado)."""
from conftest import ADMIN, OWNER, as_user
from models import Category, SpotCategory


def test_usuario_comun_no_crea_categorias(client):
    r = client.post("/categories/", json={"name": "Parapente"}, headers=as_user(OWNER))
    assert r.status_code == 403


def test_admin_crea_categorias(client):
    r = client.post("/categories/", json={"name": "Parapente"}, headers=as_user(ADMIN))
    assert r.status_code == 200


def test_usuario_comun_no_crea_amenities(client):
    r = client.post("/amenities/", json={"name": "Jacuzzi"}, headers=as_user(OWNER))
    assert r.status_code == 403


def test_admin_crea_amenities(client):
    r = client.post("/amenities/", json={"name": "Jacuzzi"}, headers=as_user(ADMIN))
    assert r.status_code == 200


def _add_category(client, spot_id, user):
    return client.post(f"/spots/{spot_id}/categories", json={"category": "Trekking"}, headers=as_user(user))


def test_duenio_no_suma_categorias_a_un_spot_aprobado(client, db, make_spot):
    spot = make_spot()
    db.add(Category(name="Trekking"))
    db.commit()
    assert _add_category(client, spot.id, OWNER).status_code == 403
    assert db.query(SpotCategory).count() == 0


def test_duenio_si_mientras_el_spot_no_esta_aprobado(client, db, make_spot):
    # Es lo que hace agregar-lugar al crear el spot.
    spot = make_spot(approved=False)
    db.add(Category(name="Trekking"))
    db.commit()
    assert _add_category(client, spot.id, OWNER).status_code == 200


def test_admin_suma_categorias_a_un_spot_aprobado(client, db, make_spot):
    spot = make_spot()
    db.add(Category(name="Trekking"))
    db.commit()
    assert _add_category(client, spot.id, ADMIN).status_code == 200
