"""Rechazar un spot nuevo o despublicar uno aprobado con motivo, y que el
dueño lo corrija y lo vuelva a enviar."""
from conftest import ADMIN, OTHER, OWNER, as_user
from models import SpotDB


def reject(client, spot_id, reason="Faltan fotos del lugar", user=ADMIN):
    return client.post(f"/admin/spots/{spot_id}/reject", json={"reason": reason}, headers=as_user(user))


def mine(client):
    return client.get("/spots/mine", headers=as_user(OWNER)).json()[0]


def test_rechazar_un_spot_nuevo_guarda_el_motivo_y_no_lo_borra(client, db, make_spot):
    spot = make_spot(approved=False)
    assert reject(client, spot.id, "  Faltan fotos del lugar ").status_code == 200
    db.expire_all()
    s = db.get(SpotDB, spot.id)
    assert (s.is_approved, s.rejection_reason) == (False, "Faltan fotos del lugar")
    assert s.rejected_at is not None
    assert mine(client)["rejection_reason"] == "Faltan fotos del lugar"


def test_el_motivo_es_obligatorio(client, make_spot):
    spot = make_spot(approved=False)
    assert reject(client, spot.id, "").status_code == 422


def test_solo_el_admin_rechaza(client, make_spot):
    spot = make_spot(approved=False)
    assert reject(client, spot.id, user=OWNER).status_code == 403


def test_despublicar_un_spot_aprobado_con_motivo(client, db, make_spot):
    spot = make_spot()
    reject(client, spot.id, "La información de acceso está desactualizada")
    db.expire_all()
    assert db.get(SpotDB, spot.id).is_approved is False
    assert client.get("/spots/by-slug/cascada-escondida").status_code == 404


def test_despublicar_vuelca_el_pedido_de_cambio_pendiente(client, db, make_spot):
    spot = make_spot()
    client.patch(f"/admin/spots/{spot.id}", json={"name": "Nombre en revisión"}, headers=as_user(OWNER))
    reject(client, spot.id)
    db.expire_all()
    assert db.get(SpotDB, spot.id).name == "Nombre en revisión"


def test_el_duenio_corrige_y_lo_vuelve_a_enviar(client, db, make_spot):
    spot = make_spot(approved=False)
    reject(client, spot.id)
    # Rechazado sigue sin aprobar: sus ediciones van directo.
    client.patch(f"/admin/spots/{spot.id}", json={"description": "Ahora con más detalle"}, headers=as_user(OWNER))
    assert client.post(f"/spots/{spot.id}/resubmit", headers=as_user(OWNER)).status_code == 200
    s = mine(client)
    assert (s["rejection_reason"], s["rejected_at"], s["description"]) == (None, None, "Ahora con más detalle")


def test_no_se_reenvia_lo_que_no_esta_rechazado(client, make_spot):
    spot = make_spot(approved=False)
    assert client.post(f"/spots/{spot.id}/resubmit", headers=as_user(OWNER)).status_code == 409


def test_otro_usuario_no_reenvia(client, make_spot):
    spot = make_spot(approved=False)
    reject(client, spot.id)
    assert client.post(f"/spots/{spot.id}/resubmit", headers=as_user(OTHER)).status_code == 403


def test_aprobar_borra_el_rechazo(client, db, make_spot):
    spot = make_spot(approved=False)
    reject(client, spot.id)
    client.patch(f"/admin/spots/{spot.id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    db.expire_all()
    s = db.get(SpotDB, spot.id)
    assert (s.is_approved, s.rejection_reason, s.rejected_at) == (True, None, None)


def test_el_admin_ve_el_motivo_en_su_lista(client, make_spot):
    spot = make_spot(approved=False)
    reject(client, spot.id, "Duplicado")
    [row] = client.get("/admin/spots", headers=as_user(ADMIN)).json()
    assert row["rejection_reason"] == "Duplicado"
