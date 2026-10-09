"""Pedidos de cambio de escuelas de surf y servicios de kayak: mismo criterio
que los de spots (operators.py)."""
import pytest

from conftest import ADMIN, OTHER, as_user, every
from models import KayakDetail, OperatorChangeRequest, SurfSchool

OPERATOR = "operador@test.com"


def photo(spot_id, n):
    return f"https://res.cloudinary.com/demo/image/upload/v1/rumbo/spots/{spot_id}/{n:016x}.jpg"


def pid(spot_id, n):
    return f"rumbo/spots/{spot_id}/{n:016x}"


@pytest.fixture
def school(db, make_spot):
    """Escuela publicada, con dueño propio y dos fotos, en una playa."""
    beach = make_spot(name="Playa Brava", category="Surf")
    s = SurfSchool(
        spot_id=beach.id, name="Escuela Ola", owner_email=OPERATOR, whatsapp="099",
        photo_1=photo(beach.id, 1), photo_2=photo(beach.id, 2),
    )
    db.add(s)
    db.commit()
    return s


def edit(client, school, body, user=OPERATOR, dry_run=False):
    params = {"dry_run": "true"} if dry_run else None
    return client.patch(f"/operators/surf_school/{school.id}", json=body, params=params, headers=as_user(user))


def reload(db, school):
    db.expire_all()
    return every(db, SurfSchool).filter_by(id=school.id).one()


# -------- Editar --------

def test_nombre_a_revision_y_contacto_al_instante(client, db, school):
    r = edit(client, school, {"name": "Ola Nueva", "whatsapp": "098"})
    assert r.status_code == 200, r.text
    assert (r.json()["applied"], r.json()["pending"]) == (["whatsapp"], ["name"])
    s = reload(db, school)
    assert (s.name, s.whatsapp) == ("Escuela Ola", "098")


def test_dry_run_no_escribe(client, db, school):
    r = edit(client, school, {"name": "Ola Nueva"}, dry_run=True)
    assert r.json()["pending"] == ["name"]
    assert db.query(OperatorChangeRequest).count() == 0


def test_foto_nueva_a_revision(client, db, school):
    sid = school.spot_id
    r = edit(client, school, {"photos": [photo(sid, 1), photo(sid, 3)]})
    assert r.json()["pending"] == ["photos"]
    assert reload(db, school).photo_2 == photo(sid, 2), "lo publicado no cambia hasta aprobar"


def test_sacar_una_foto_se_aplica_ya_y_la_borra(client, db, school, destroyed):
    sid = school.spot_id
    r = edit(client, school, {"photos": [photo(sid, 2)]})
    assert r.json()["applied"] == ["photos"]
    s = reload(db, school)
    assert (s.photo_1, s.photo_2) == (photo(sid, 2), None)
    assert destroyed == [pid(sid, 1)]


def test_foto_invalida(client, school):
    r = edit(client, school, {"photos": ["https://otro.com/x.jpg"]})
    assert r.status_code == 400


def test_un_pedido_a_la_vez(client, school):
    edit(client, school, {"name": "Primero"})
    assert edit(client, school, {"name": "Segundo"}).status_code == 409
    assert edit(client, school, {"whatsapp": "097"}).status_code == 200, "lo instantáneo sigue andando"


def test_solo_su_duenio_o_el_admin(client, school):
    assert edit(client, school, {"whatsapp": "1"}, user=OTHER).status_code == 403
    r = edit(client, school, {"name": "Por admin"}, user=ADMIN)
    assert r.json()["applied"] == ["name"], "el admin edita directo"


def test_una_escuela_en_revision_se_edita_directo(client, db, make_spot):
    beach = make_spot(name="Playa", category="Surf")
    school_id = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Nueva"}, headers=as_user(OPERATOR)).json()["id"]
    r = client.patch(f"/operators/surf_school/{school_id}", json={"name": "Corregida"}, headers=as_user(OPERATOR))
    assert r.json()["applied"] == ["name"]


def test_kayak_tiene_sus_propios_campos(client, db, make_spot):
    lake = make_spot(name="Laguna", category="Kayak")
    k = KayakDetail(spot_id=lake.id, name="Kayak", owner_email=OPERATOR, water_type="lago")
    db.add(k)
    db.commit()
    r = client.patch(f"/operators/kayak/{k.id}", json={"water_type": "rio", "class_type": "ignorado"}, headers=as_user(OPERATOR))
    assert r.json()["applied"] == ["water_type"]


# -------- Revisión del admin --------

def test_aprobar_aplica_nombre_y_fotos_y_borra_las_reemplazadas(client, db, school, destroyed):
    sid = school.spot_id
    edit(client, school, {"name": "Ola Nueva", "photos": [photo(sid, 3), photo(sid, 1)]})
    [pending] = client.get("/admin/operator-change-requests", headers=as_user(ADMIN)).json()
    assert pending["operator"]["name"] == "Escuela Ola"
    r = client.post(f"/admin/operator-change-requests/{pending['id']}/approve", headers=as_user(ADMIN))
    assert r.status_code == 200
    s = reload(db, school)
    assert (s.name, s.photo_1, s.photo_2) == ("Ola Nueva", photo(sid, 3), photo(sid, 1))
    assert destroyed == [pid(sid, 2)]


def test_rechazar_borra_las_fotos_nuevas_y_el_duenio_ve_el_motivo(client, db, school, destroyed):
    sid = school.spot_id
    edit(client, school, {"photos": [photo(sid, 1), photo(sid, 2), photo(sid, 3)]})
    change_id = db.query(OperatorChangeRequest).one().id
    client.post(f"/admin/operator-change-requests/{change_id}/reject", json={"reason": "Foto borrosa"}, headers=as_user(ADMIN))
    assert destroyed == [pid(sid, 3)]
    view = client.get(f"/operators/surf_school/{school.id}", headers=as_user(OPERATOR)).json()
    assert (view["change_request"]["status"], view["change_request"]["reject_reason"]) == ("rejected", "Foto borrosa")
    client.post(f"/operators/surf_school/{school.id}/change-request/dismiss", headers=as_user(OPERATOR))
    assert client.get(f"/operators/surf_school/{school.id}", headers=as_user(OPERATOR)).json()["change_request"] is None


def test_listado_admin_solo_para_admin(client, school):
    assert client.get("/admin/operator-change-requests", headers=as_user(OPERATOR)).status_code == 403


def test_cancelar_borra_las_fotos_nuevas(client, db, school, destroyed):
    sid = school.spot_id
    edit(client, school, {"photos": [photo(sid, 4)]})
    assert client.post(f"/operators/surf_school/{school.id}/change-request/cancel", headers=as_user(OPERATOR)).status_code == 200
    assert destroyed == [pid(sid, 4)]
    assert db.query(OperatorChangeRequest).one().status == "cancelled"


def test_borrar_la_escuela_cancela_su_pedido(client, db, school, destroyed):
    sid = school.spot_id
    edit(client, school, {"photos": [photo(sid, 1), photo(sid, 5)]})
    assert client.delete(f"/surfschool/{school.id}", headers=as_user(OPERATOR)).status_code == 200
    assert set(destroyed) == {pid(sid, 1), pid(sid, 2), pid(sid, 5)}
    assert db.query(OperatorChangeRequest).one().status == "cancelled"


def test_borrar_la_playa_borra_las_fotos_de_los_pedidos(client, db, school, destroyed):
    sid = school.spot_id
    edit(client, school, {"photos": [photo(sid, 6)]})
    client.delete(f"/spots/{sid}", headers=as_user(ADMIN))
    assert pid(sid, 6) in destroyed


def test_borrar_la_cuenta_cancela_sus_pedidos(client, db, school, make_user, destroyed):
    sid = school.spot_id
    edit(client, school, {"photos": [photo(sid, 7)]})
    make_user(OPERATOR)
    client.delete("/users/me", headers=as_user(OPERATOR))
    assert pid(sid, 7) in destroyed
    assert db.query(OperatorChangeRequest).one().status == "cancelled"


# -------- Tus escuelas --------

def test_mis_escuelas_incluye_las_que_estan_en_revision(client, db, school, make_spot):
    lake = make_spot(name="Laguna", category="Kayak")
    client.post("/kayak/", json={"spot_id": lake.id, "name": "Kayak nuevo"}, headers=as_user(OPERATOR))
    mine = client.get("/operators/mine", headers=as_user(OPERATOR)).json()
    assert [(m["kind"], m["name"], m["is_approved"]) for m in mine] == [
        ("surf_school", "Escuela Ola", True), ("kayak", "Kayak nuevo", False),
    ]
    assert mine[1]["contribution_id"] is not None
    assert mine[0]["spot"]["name"] == "Playa Brava"


def test_descartar_fotos_subidas_si_el_guardado_fallo(client, db, school, destroyed):
    sid = school.spot_id
    r = client.post(
        f"/operators/surf_school/{school.id}/discard-photos",
        json={"public_ids": [photo(sid, 9), photo(sid, 1), "https://otro.com/x.jpg", photo(999, 1)]},
        headers=as_user(OPERATOR),
    )
    assert r.status_code == 200
    # No toca la que usa la escuela, ni URLs ajenas o de otra playa.
    assert destroyed == [pid(sid, 9)]
    assert client.post(f"/operators/surf_school/{school.id}/discard-photos", json={"public_ids": []}, headers=as_user(OTHER)).status_code == 403


# -------- Descripción y precio --------

def test_precio_al_instante_y_descripcion_a_revision(client, db, school):
    r = edit(client, school, {"price_from": 1200, "price_note": "por clase", "description": "Clases para toda la familia."})
    assert r.status_code == 200, r.text
    assert (sorted(r.json()["applied"]), r.json()["pending"]) == (["price_from", "price_note"], ["description"])
    s = reload(db, school)
    assert (s.price_from, s.price_note, s.description) == (1200, "por clase", None)


def test_aprobar_aplica_la_descripcion(client, db, school):
    edit(client, school, {"description": "  Clases para toda la familia.  "})
    [pending] = client.get("/admin/operator-change-requests", headers=as_user(ADMIN)).json()
    assert pending["changes"]["description"] == {"from": None, "to": "Clases para toda la familia."}
    assert pending["operator"]["description"] is None
    client.post(f"/admin/operator-change-requests/{pending['id']}/approve", headers=as_user(ADMIN))
    assert reload(db, school).description == "Clases para toda la familia."


def test_misma_descripcion_no_crea_pedido(client, db, school):
    school.description = "Igual"
    db.commit()
    r = edit(client, school, {"description": " Igual "})
    assert (r.json()["applied"], r.json()["pending"]) == ([], [])


def test_precio_negativo_no(client, school):
    assert edit(client, school, {"price_from": -1}).status_code == 422
