"""GET /spots/{id}/can-upload: la firma de Cloudinary solo se da para un
public_id nuevo, con el formato del spot y que no exista en ningún lado."""
from conftest import OTHER, OWNER, as_user
from models import SpotImage


def can_upload(client, spot_id, public_id, user=OWNER):
    return client.get(f"/spots/{spot_id}/can-upload", params={"public_id": public_id}, headers=as_user(user))


def test_id_nuevo_con_formato_correcto(client, make_spot):
    spot = make_spot()
    assert can_upload(client, spot.id, f"{spot.id}/0123456789abcdef").status_code == 200


def test_formato_viejo_predecible(client, make_spot):
    spot = make_spot()
    assert can_upload(client, spot.id, "Camping/Cascada_Escondida/Cascada_Escondida3").status_code == 400


def test_id_de_otro_spot(client, make_spot):
    otro = make_spot(name="Otro", owner=OTHER)
    spot = make_spot()
    assert can_upload(client, spot.id, f"{otro.id}/0123456789abcdef").status_code == 400


def test_formatos_casi_validos(client, make_spot):
    spot = make_spot()
    for public_id in [
        f"{spot.id}/0123456789ABCDEF",     # mayúsculas
        f"{spot.id}/0123456789abcde",      # 15 caracteres
        f"{spot.id}/0123456789abcdef/x",   # algo agregado
        f"x{spot.id}/0123456789abcdef",
    ]:
        assert can_upload(client, spot.id, public_id).status_code == 400, public_id


def test_no_se_puede_reusar_una_foto_publicada_del_mismo_spot(client, db, make_spot):
    # Era el agujero: pedir la firma para el id de una foto propia ya
    # aprobada y reemplazar el archivo en Cloudinary sin revisión.
    spot = make_spot()
    db.add(SpotImage(spot_id=spot.id, cloudinary_public_id=f"rumbo/spots/{spot.id}/0123456789abcdef"))
    db.commit()
    assert can_upload(client, spot.id, f"{spot.id}/0123456789abcdef").status_code == 409


def test_no_se_puede_reusar_una_foto_de_un_pedido_pendiente(client, make_spot):
    spot = make_spot()
    client.patch(
        f"/admin/spots/{spot.id}",
        json={"photos_added": [f"rumbo/spots/{spot.id}/0123456789abcdef"]},
        headers=as_user(OWNER),
    )
    assert can_upload(client, spot.id, f"{spot.id}/0123456789abcdef").status_code == 409


def test_spot_ajeno(client, make_spot):
    spot = make_spot()
    assert can_upload(client, spot.id, f"{spot.id}/0123456789abcdef", user=OTHER).status_code == 403
