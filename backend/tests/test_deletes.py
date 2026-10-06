"""El dueño del lugar (o el admin) borra rutas, sectores, vías, surf y kayak,
aprobados o en revisión."""
from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import ClimbingRoute, ClimbingSector, Contribution, KayakDetail, Route, SurfSchool

CLOUD_URL = "https://res.cloudinary.com/demo/image/upload/v1/rumbo/spots/{spot}/{n:016x}.jpg"


def contribution(db, kind):
    return db.query(Contribution).filter_by(kind=kind).one()


# -------- Rutas de trekking --------

def test_duenio_borra_una_ruta_aprobada(client, db, make_spot):
    spot = make_spot()
    route = Route(spot_id=spot.id, name="Sendero")
    db.add(route)
    db.commit()
    assert client.delete(f"/routes/{route.id}", headers=as_user(OWNER)).status_code == 200
    assert every(db, Route).count() == 0


def test_borrar_una_ruta_pendiente_retira_su_aporte(client, db, make_spot):
    spot = make_spot()
    route_id = client.post("/routes/", json={"spot_id": spot.id, "name": "Nueva"}, headers=as_user(OWNER)).json()["id"]
    assert client.delete(f"/routes/{route_id}", headers=as_user(OWNER)).status_code == 200
    assert contribution(db, "trekking_route").status == "withdrawn"


def test_otro_usuario_no_borra_rutas(client, db, make_spot):
    spot = make_spot()
    route = Route(spot_id=spot.id, name="Sendero")
    db.add(route)
    db.commit()
    assert client.delete(f"/routes/{route.id}", headers=as_user(OTHER)).status_code == 403
    assert every(db, Route).count() == 1


def test_admin_borra_rutas(client, db, make_spot):
    spot = make_spot()
    route = Route(spot_id=spot.id, name="Sendero")
    db.add(route)
    db.commit()
    assert client.delete(f"/routes/{route.id}", headers=as_user(ADMIN)).status_code == 200


def test_ruta_inexistente(client):
    assert client.delete("/routes/999", headers=as_user(OWNER)).status_code == 404


# -------- Escalada --------

def test_duenio_borra_un_sector_sugerido_por_otro_con_sus_vias(client, db, make_spot):
    spot = make_spot()
    sector_id = client.post("/sectors/", json={"spot_id": spot.id, "name": "Sugerido"}, headers=as_user(OTHER)).json()["id"]
    client.post("/climbingroutes/", json={"sector_id": sector_id, "name": "Vía"}, headers=as_user(OTHER))
    assert client.delete(f"/sectors/{sector_id}", headers=as_user(OWNER)).status_code == 200
    assert every(db, ClimbingSector).count() == 0
    assert every(db, ClimbingRoute).count() == 0
    assert contribution(db, "climbing_sector").status == "withdrawn"


def test_borrar_un_sector_retira_los_aportes_pendientes_de_sus_vias(client, db, make_spot):
    spot = make_spot()
    sector = ClimbingSector(spot_id=spot.id, name="Aprobado")
    db.add(sector)
    db.commit()
    client.post("/climbingroutes/", json={"sector_id": sector.id, "name": "Vía nueva"}, headers=as_user(OTHER))
    client.delete(f"/sectors/{sector.id}", headers=as_user(OWNER))
    assert contribution(db, "climbing_route").status == "withdrawn"


def test_quien_sugirio_un_sector_no_lo_borra_por_aca(client, make_spot):
    # Lo retira desde /profile (withdraw): el borrado es del dueño del lugar.
    spot = make_spot()
    sector_id = client.post("/sectors/", json={"spot_id": spot.id, "name": "Sugerido"}, headers=as_user(OTHER)).json()["id"]
    assert client.delete(f"/sectors/{sector_id}", headers=as_user(OTHER)).status_code == 403


def test_duenio_borra_una_via(client, db, make_spot):
    spot = make_spot()
    sector = ClimbingSector(spot_id=spot.id, name="Aprobado")
    db.add(sector)
    db.flush()
    route = ClimbingRoute(sector_id=sector.id, name="Vía")
    db.add(route)
    db.commit()
    assert client.delete(f"/climbingroutes/{route.id}", headers=as_user(OWNER)).status_code == 200
    assert every(db, ClimbingRoute).count() == 0
    assert client.delete("/climbingroutes/999", headers=as_user(OWNER)).status_code == 404


# -------- Surf y kayak --------

def test_borrar_una_escuela_borra_sus_fotos(client, db, make_spot, destroyed):
    spot = make_spot()
    school = SurfSchool(spot_id=spot.id, name="Ola", photo_1=CLOUD_URL.format(spot=spot.id, n=1))
    db.add(school)
    db.commit()
    assert client.delete(f"/surfschool/{school.id}", headers=as_user(OWNER)).status_code == 200
    assert every(db, SurfSchool).count() == 0
    assert destroyed == [f"rumbo/spots/{spot.id}/{1:016x}"]


def test_otro_usuario_no_borra_kayaks(client, db, make_spot):
    spot = make_spot()
    kayak = KayakDetail(spot_id=spot.id, name="Laguna")
    db.add(kayak)
    db.commit()
    assert client.delete(f"/kayak/{kayak.id}", headers=as_user(OTHER)).status_code == 403
    assert client.delete(f"/kayak/{kayak.id}", headers=as_user(OWNER)).status_code == 200


# -------- Dashboard --------

def test_owner_content_trae_todo_con_lo_pendiente(client, db, make_spot):
    spot = make_spot()
    sector = ClimbingSector(spot_id=spot.id, name="Aprobado")
    db.add_all([sector, Route(spot_id=spot.id, name="Sendero"), KayakDetail(spot_id=spot.id, name="Laguna")])
    db.commit()
    client.post("/climbingroutes/", json={"sector_id": sector.id, "name": "Vía nueva"}, headers=as_user(OTHER))
    client.post("/surfschool/", json={"spot_id": spot.id, "name": "Ola"}, headers=as_user(OWNER))
    body = client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OWNER)).json()
    assert [r["name"] for r in body["routes"]] == ["Sendero"]
    [s] = body["sectors"]
    assert [(r["name"], r["is_approved"]) for r in s["routes"]] == [("Vía nueva", False)]
    assert [(x["name"], x["is_approved"]) for x in body["surf_schools"]] == [("Ola", False)]
    assert [k["name"] for k in body["kayaks"]] == ["Laguna"]
