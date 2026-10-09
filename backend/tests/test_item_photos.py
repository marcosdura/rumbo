"""Fotos de rutas de trekking, sectores y vías (item_photos.py): cualquier
logueado las sube, todas pasan por revisión (salvo el admin), hasta 3."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import ClimbingRoute, ClimbingSector, Contribution, ItemPhoto, Route


def pid(spot_id, n):
    return f"rumbo/spots/{spot_id}/{n:016x}"


@pytest.fixture
def world(db, make_spot):
    cerro = make_spot(name="Cerro", category="Trekking", slug="cerro")
    route = Route(spot_id=cerro.id, name="Cumbre", slug="cumbre")
    peña = make_spot(name="Peña", category="Escalada", slug="pena")
    sector = ClimbingSector(spot_id=peña.id, name="Norte", slug="norte")
    db.add_all([route, sector])
    db.flush()
    via = ClimbingRoute(sector_id=sector.id, name="Fisura", grade="6a")
    db.add(via)
    db.commit()
    return {"cerro": cerro, "route": route, "pena": peña, "sector": sector, "via": via}


def upload(client, target, target_id, ids, user=OTHER):
    return client.post("/photos", json={"target": target, "target_id": target_id, "public_ids": ids}, headers=as_user(user))


def test_cualquiera_sube_y_queda_en_revision(client, db, world):
    c = world["cerro"]
    r = upload(client, "trekking_route", world["route"].id, [pid(c.id, 1), f"{c.id}/{2:016x}"])
    assert r.status_code == 200, r.text
    assert r.json()["pending"] is True
    photos = every(db, ItemPhoto).all()
    assert [p.cloudinary_public_id for p in photos] == [pid(c.id, 1), pid(c.id, 2)]
    assert not any(p.is_approved for p in photos)
    titles = [x.title for x in db.query(Contribution).filter_by(kind="photo")]
    assert titles == ["Foto de «Cumbre»", "Foto de «Cumbre»"]
    # En revisión no se ven.
    assert client.get("/routes/page/cerro/cumbre").json()["route"]["photos"] == []


def test_el_duenio_del_lugar_tambien_pasa_por_revision_y_el_admin_no(client, world):
    c = world["cerro"]
    assert upload(client, "trekking_route", world["route"].id, [pid(c.id, 1)], user=OWNER).json()["pending"] is True
    assert upload(client, "trekking_route", world["route"].id, [pid(c.id, 2)], user=ADMIN).json()["pending"] is False
    page = client.get("/routes/page/cerro/cumbre").json()["route"]
    assert [p["cloudinary_public_id"] for p in page["photos"]] == [pid(c.id, 2)]
    assert page["photo_slots"] == 1


def test_aprobar_la_publica(client, db, world):
    p = world["pena"]
    upload(client, "climbing_route", world["via"].id, [pid(p.id, 7)])
    [contribution] = client.get("/admin/contributions", headers=as_user(ADMIN)).json()
    assert contribution["item"] == {"cloudinary_public_id": pid(p.id, 7), "target_name": "Fisura"}
    client.post(f"/admin/contributions/{contribution['id']}/approve", headers=as_user(ADMIN))
    [via] = client.get("/sectors/page/pena/norte").json()["routes"]
    assert [ph["cloudinary_public_id"] for ph in via["photos"]] == [pid(p.id, 7)]
    assert via["photo_slots"] == 2


def test_rechazar_borra_la_foto_y_su_archivo(client, db, world, destroyed):
    p = world["pena"]
    upload(client, "climbing_sector", world["sector"].id, [pid(p.id, 3)])
    contribution = db.query(Contribution).filter_by(kind="photo").one()
    client.post(f"/admin/contributions/{contribution.id}/reject", json={"reason": "Borrosa"}, headers=as_user(ADMIN))
    assert every(db, ItemPhoto).count() == 0
    assert destroyed == [pid(p.id, 3)]


def test_hasta_tres_contando_las_en_revision(client, world):
    c = world["cerro"]
    assert upload(client, "trekking_route", world["route"].id, [pid(c.id, 1), pid(c.id, 2)]).status_code == 200
    assert upload(client, "trekking_route", world["route"].id, [pid(c.id, 3), pid(c.id, 4)]).status_code == 409
    assert upload(client, "trekking_route", world["route"].id, [pid(c.id, 3)]).status_code == 200
    assert client.get("/routes/page/cerro/cumbre").json()["route"]["photo_slots"] == 0


def test_la_foto_tiene_que_ser_de_la_carpeta_de_ese_lugar_y_nueva(client, world):
    c, p = world["cerro"], world["pena"]
    assert upload(client, "trekking_route", world["route"].id, [pid(p.id, 1)]).status_code == 400
    assert upload(client, "trekking_route", world["route"].id, ["cualquiera/abc"]).status_code == 400
    upload(client, "trekking_route", world["route"].id, [pid(c.id, 1)])
    assert upload(client, "trekking_route", world["route"].id, [pid(c.id, 1)]).status_code == 409


def test_sin_sesion_no(client, world):
    r = client.post("/photos", json={"target": "trekking_route", "target_id": world["route"].id, "public_ids": [pid(world["cerro"].id, 1)]})
    assert r.status_code == 401


def test_no_a_una_ruta_de_un_lugar_sin_publicar(client, db, make_spot):
    oculto = make_spot(name="Oculto", category="Trekking", approved=False)
    route = Route(spot_id=oculto.id, name="R", slug="r")
    db.add(route)
    db.commit()
    assert upload(client, "trekking_route", route.id, [pid(oculto.id, 1)]).status_code == 404


def test_cualquiera_puede_pedir_firma_para_subir_en_un_lugar_con_rutas(client, world, make_spot):
    c = world["cerro"]
    assert client.get(f"/spots/{c.id}/can-upload", params={"public_id": f"{c.id}/{9:016x}"}, headers=as_user(OTHER)).status_code == 200
    # Un camping ajeno sin rutas ni sectores: no.
    camping = make_spot(name="Camping", category="Camping")
    assert client.get(f"/spots/{camping.id}/can-upload", params={"public_id": f"{camping.id}/{9:016x}"}, headers=as_user(OTHER)).status_code == 403


def test_can_upload_no_reusa_una_foto_de_ruta(client, world):
    c = world["cerro"]
    upload(client, "trekking_route", world["route"].id, [pid(c.id, 5)])
    assert client.get(f"/spots/{c.id}/can-upload", params={"public_id": f"{c.id}/{5:016x}"}, headers=as_user(OTHER)).status_code == 409


def test_borrar_la_via_borra_sus_fotos_y_cierra_sus_aportes(client, db, world, destroyed):
    p = world["pena"]
    upload(client, "climbing_route", world["via"].id, [pid(p.id, 1)])
    upload(client, "climbing_sector", world["sector"].id, [pid(p.id, 2)], user=ADMIN)
    r = client.delete(f"/sectors/{world['sector'].id}", headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    assert every(db, ItemPhoto).count() == 0
    assert sorted(destroyed) == sorted([pid(p.id, 1), pid(p.id, 2)])
    assert [c.status for c in db.query(Contribution).filter_by(kind="photo")] == ["withdrawn"]


def test_borrar_el_lugar_borra_los_archivos(client, db, world, destroyed):
    c = world["cerro"]
    upload(client, "trekking_route", world["route"].id, [pid(c.id, 1)])
    assert client.delete(f"/spots/{c.id}", headers=as_user(ADMIN)).status_code == 200
    assert pid(c.id, 1) in destroyed


# -------- Agregar lugar: fotos apenas se crea la ruta, sector o vía --------

def test_quien_propuso_un_sector_en_revision_le_suma_fotos_a_el_y_a_sus_vias(client, db, make_spot):
    pena = make_spot(name="Peña", category="Escalada", slug="pena")
    r = client.post("/sectors/", json={"spot_id": pena.id, "name": "Sur"}, headers=as_user(OTHER))
    sector_id = r.json()["id"]
    via_id = client.post("/climbingroutes/", json={"sector_id": sector_id, "name": "Diedro"}, headers=as_user(OTHER)).json()["id"]
    assert upload(client, "climbing_sector", sector_id, [pid(pena.id, 1)]).status_code == 200
    assert upload(client, "climbing_route", via_id, [pid(pena.id, 2)]).status_code == 200
    # Otro usuario, no: todavía no está publicado.
    assert upload(client, "climbing_sector", sector_id, [pid(pena.id, 3)], user=OWNER).status_code == 404


def test_el_duenio_le_suma_fotos_a_las_rutas_de_su_lugar_sin_aprobar(client, db, make_spot):
    nuevo = make_spot(name="Nuevo", category="Trekking", approved=False)
    route = Route(spot_id=nuevo.id, name="R", slug="r")
    db.add(route)
    db.commit()
    assert upload(client, "trekking_route", route.id, [pid(nuevo.id, 1)], user=OWNER).status_code == 200
    assert upload(client, "trekking_route", route.id, [pid(nuevo.id, 2)], user=OTHER).status_code == 404


def test_rechazar_el_sector_borra_sus_fotos_y_las_de_sus_vias(client, db, make_spot, destroyed):
    pena = make_spot(name="Peña", category="Escalada", slug="pena")
    sector_id = client.post("/sectors/", json={"spot_id": pena.id, "name": "Sur"}, headers=as_user(OTHER)).json()["id"]
    via_id = client.post("/climbingroutes/", json={"sector_id": sector_id, "name": "Diedro"}, headers=as_user(OTHER)).json()["id"]
    upload(client, "climbing_sector", sector_id, [pid(pena.id, 1)])
    upload(client, "climbing_route", via_id, [pid(pena.id, 2)])
    contribution = db.query(Contribution).filter_by(kind="climbing_sector").one()
    r = client.post(f"/admin/contributions/{contribution.id}/reject", json={"reason": "No existe"}, headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    assert every(db, ItemPhoto).count() == 0
    assert sorted(destroyed) == [pid(pena.id, 1), pid(pena.id, 2)]
    assert {c.status for c in db.query(Contribution).filter_by(kind="photo")} == {"withdrawn"}


def test_firma_para_subir_con_el_primer_sector_todavia_en_revision(client, make_spot):
    pena = make_spot(name="Peña", category="Escalada", slug="pena")
    client.post("/sectors/", json={"spot_id": pena.id, "name": "Sur"}, headers=as_user(OTHER))
    r = client.get(f"/spots/{pena.id}/can-upload", params={"public_id": f"{pena.id}/{9:016x}"}, headers=as_user(OTHER))
    assert r.status_code == 200, r.text
