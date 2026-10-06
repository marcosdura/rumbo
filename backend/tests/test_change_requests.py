"""Ciclo de vida de un pedido de cambio: lo que ve el dueño, cancelar,
aprobar, rechazar, y los casos borde (borrar spot o cuenta, desaprobar)."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user, new_photo_id
from models import SpotChangeRequest, SpotDB, SpotImage


def request_change(client, spot_id, body, user=OWNER):
    r = client.patch(f"/admin/spots/{spot_id}", json=body, headers=as_user(user))
    assert r.status_code == 200, r.text
    return r.json()["change_request"]


def my_change_request(client, user=OWNER):
    spots = client.get("/spots/mine", headers=as_user(user)).json()
    return spots[0]["change_request"]


def pending_ids(client):
    return [r["id"] for r in client.get("/admin/change-requests", headers=as_user(ADMIN)).json()]


@pytest.fixture
def spot_with_request(client, make_spot):
    """Spot aprobado con 2 fotos publicadas y un pedido de nombre + 2 fotos."""
    spot = make_spot(photos=2)
    photos = [new_photo_id(spot.id, 1), new_photo_id(spot.id, 2)]
    req = request_change(client, spot.id, {"name": "Nuevo nombre", "photos_added": photos})
    return spot, req, photos


# -------- Lo que ve el dueño --------

def test_mine_trae_el_pedido_pendiente(client, spot_with_request):
    _, req, _ = spot_with_request
    assert my_change_request(client) == req


def test_spot_sin_pedido(client, make_spot):
    make_spot()
    assert my_change_request(client) is None


# -------- Cancelar --------

def test_cancelar_borra_las_fotos_nuevas_de_cloudinary(client, db, spot_with_request, destroyed):
    spot, _, photos = spot_with_request
    r = client.post(f"/spots/{spot.id}/change-request/cancel", headers=as_user(OWNER))
    assert r.status_code == 200
    assert destroyed == photos
    assert db.query(SpotChangeRequest).one().status == "cancelled"


def test_cancelado_no_se_le_muestra_al_duenio(client, spot_with_request):
    spot, _, _ = spot_with_request
    client.post(f"/spots/{spot.id}/change-request/cancel", headers=as_user(OWNER))
    assert my_change_request(client) is None


def test_cancelar_libera_el_lugar_para_otro_pedido(client, spot_with_request):
    spot, _, _ = spot_with_request
    client.post(f"/spots/{spot.id}/change-request/cancel", headers=as_user(OWNER))
    request_change(client, spot.id, {"description": "Otra cosa"})


def test_cancelar_sin_pedido_da_404(client, make_spot):
    spot = make_spot()
    assert client.post(f"/spots/{spot.id}/change-request/cancel", headers=as_user(OWNER)).status_code == 404


def test_otro_usuario_no_puede_cancelar(client, spot_with_request):
    spot, _, _ = spot_with_request
    assert client.post(f"/spots/{spot.id}/change-request/cancel", headers=as_user(OTHER)).status_code == 403


# -------- Descartar fotos subidas cuando el guardado falló --------

def test_descartar_solo_borra_fotos_libres_y_propias(client, make_spot, spot_with_request, destroyed):
    spot, _, photos = spot_with_request
    otro = make_spot(name="Otro", owner=OTHER)
    huerfana = new_photo_id(spot.id, 7)
    r = client.post(
        f"/spots/{spot.id}/change-request/discard-photos",
        json={"public_ids": [huerfana, photos[0], f"viejas/{spot.id}/0", new_photo_id(otro.id, 1)]},
        headers=as_user(OWNER),
    )
    assert r.status_code == 200
    # No toca: la del pedido pendiente, la publicada, ni la de otro spot.
    assert destroyed == [huerfana]


# -------- Admin --------

def test_listado_admin_solo_para_admin(client, spot_with_request):
    assert client.get("/admin/change-requests", headers=as_user(OWNER)).status_code == 403


def test_listado_admin_trae_el_valor_actual(client, spot_with_request):
    _, req, _ = spot_with_request
    listado = client.get("/admin/change-requests", headers=as_user(ADMIN)).json()
    assert [r["id"] for r in listado] == [req["id"]]
    assert listado[0]["spot"]["current"]["name"] == "Cascada Escondida"
    assert listado[0]["requested_by"] == OWNER


def test_aprobar_publica_el_cambio(client, db, spot_with_request):
    spot, req, photos = spot_with_request
    r = client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    assert r.status_code == 200
    db.expire_all()
    spot_db = db.get(SpotDB, spot.id)
    assert spot_db.name == "Nuevo nombre"
    assert spot_db.slug == "cascada-escondida", "el slug no cambia: no rompe links ni SEO"
    images = db.query(SpotImage).filter_by(spot_id=spot.id).order_by(SpotImage.order).all()
    assert [i.cloudinary_public_id for i in images][-2:] == photos, "las nuevas van al final"
    assert sum(i.is_main for i in images) == 1, "la principal no cambia"
    assert pending_ids(client) == []
    assert my_change_request(client)["status"] == "approved"


def test_aprobar_sin_foto_principal_elige_la_primera_nueva(client, db, spot_with_request):
    spot, req, photos = spot_with_request
    db.query(SpotImage).filter_by(spot_id=spot.id).delete()
    db.commit()
    client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    main = db.query(SpotImage).filter_by(spot_id=spot.id, is_main=True).one()
    assert main.cloudinary_public_id == photos[0]


def test_aprobar_revalida_el_nombre(client, make_spot, spot_with_request):
    _, req, _ = spot_with_request
    make_spot(name="Nuevo nombre", owner=OTHER, slug="otro")
    r = client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    assert r.status_code == 409
    assert pending_ids(client) == [req["id"]], "sigue pendiente"


def test_aprobar_revalida_el_limite_de_fotos(client, db, spot_with_request):
    spot, req, _ = spot_with_request
    # Mientras esperaba, el admin le sumó fotos: 2 + 7 + 2 nuevas > 10.
    for i in range(7):
        db.add(SpotImage(spot_id=spot.id, cloudinary_public_id=f"admin/{i}", order=10 + i))
    db.commit()
    r = client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    assert r.status_code == 400


def test_rechazar_borra_fotos_y_guarda_el_motivo(client, db, spot_with_request, destroyed):
    spot, req, photos = spot_with_request
    r = client.post(f"/admin/change-requests/{req['id']}/reject", json={"reason": "  La foto no es del lugar  "}, headers=as_user(ADMIN))
    assert r.status_code == 200
    assert destroyed == photos
    db.expire_all()
    assert db.get(SpotDB, spot.id).name == "Cascada Escondida"
    visto = my_change_request(client)
    assert visto["status"] == "rejected"
    assert visto["reject_reason"] == "La foto no es del lugar"


def test_rechazar_sin_motivo(client, spot_with_request):
    _, req, _ = spot_with_request
    r = client.post(f"/admin/change-requests/{req['id']}/reject", json={"reason": "   "}, headers=as_user(ADMIN))
    assert r.json()["reject_reason"] is None


def test_no_se_puede_resolver_dos_veces(client, spot_with_request):
    _, req, _ = spot_with_request
    client.post(f"/admin/change-requests/{req['id']}/reject", json={}, headers=as_user(ADMIN))
    assert client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN)).status_code == 409


def test_duenio_no_puede_aprobar(client, spot_with_request):
    _, req, _ = spot_with_request
    assert client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(OWNER)).status_code == 403


# -------- Aviso del resultado --------

def test_cerrar_el_aviso_lo_oculta(client, spot_with_request):
    spot, req, _ = spot_with_request
    client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    client.post(f"/spots/{spot.id}/change-request/dismiss", headers=as_user(OWNER))
    assert my_change_request(client) is None


def test_aviso_viejo_sin_cerrar_no_reaparece(client, spot_with_request):
    spot, req, _ = spot_with_request
    # Primer pedido aprobado y nunca cerrado; el segundo rechazado y cerrado.
    client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    second = request_change(client, spot.id, {"description": "Otra"})
    client.post(f"/admin/change-requests/{second['id']}/reject", json={}, headers=as_user(ADMIN))
    client.post(f"/spots/{spot.id}/change-request/dismiss", headers=as_user(OWNER))
    assert my_change_request(client) is None


# -------- Casos borde --------

def test_desaprobar_el_spot_vuelca_el_pedido(client, db, spot_with_request):
    spot, _, photos = spot_with_request
    r = client.patch(f"/admin/spots/{spot.id}/approve", params={"approved": False}, headers=as_user(ADMIN))
    assert r.status_code == 200
    db.expire_all()
    assert db.get(SpotDB, spot.id).name == "Nuevo nombre"
    assert db.query(SpotImage).filter(SpotImage.cloudinary_public_id.in_(photos)).count() == 2
    assert pending_ids(client) == []
    assert my_change_request(client) is None, "no es una aprobación que el dueño tenga que ver"


def test_borrar_el_spot_borra_las_fotos_del_pedido(client, db, spot_with_request, destroyed):
    spot, _, photos = spot_with_request
    r = client.delete(f"/spots/{spot.id}", headers=as_user(ADMIN))
    assert r.status_code == 200
    assert set(photos) <= set(destroyed)
    assert db.query(SpotChangeRequest).count() == 0


def test_borrar_la_cuenta_cancela_el_pedido_y_borra_sus_fotos(client, db, make_user, spot_with_request, destroyed):
    _, _, photos = spot_with_request
    make_user(OWNER)
    r = client.delete("/users/me", headers=as_user(OWNER))
    assert r.status_code == 200
    assert destroyed == photos
    assert db.query(SpotChangeRequest).one().status == "cancelled"
