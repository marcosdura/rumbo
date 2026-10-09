"""Lo que el dueño corrige desde su panel (routers/owner_edits.py): al
instante, también lo ya publicado, solo lo que viene."""
from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import Amenity, Category, Experience, GlampingDetail, ItemPhoto, Route


def test_editar_una_ruta_conserva_sus_fotos_y_su_slug(client, db, make_spot):
    spot = make_spot(name="Cerro", category="Trekking", slug="cerro")
    route = Route(spot_id=spot.id, name="Cumbre", slug="cumbre", distance_km=3, difficulty="fácil")
    db.add(route)
    db.flush()
    db.add(ItemPhoto(spot_id=spot.id, trekking_route_id=route.id, cloudinary_public_id=f"rumbo/spots/{spot.id}/{1:016x}"))
    db.commit()
    r = client.patch(f"/routes/{route.id}", json={"name": " Cumbre Norte ", "distance_km": 4.5, "description": "Por el bosque."}, headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    assert (r.json()["name"], r.json()["distance_km"], r.json()["difficulty"], r.json()["slug"]) == ("Cumbre Norte", 4.5, "fácil", "cumbre")
    assert r.json()["description"] == "Por el bosque."
    assert every(db, ItemPhoto).count() == 1


def test_una_ruta_solo_la_edita_el_duenio_o_el_admin(client, db, make_spot):
    spot = make_spot(name="Cerro", category="Trekking")
    route = Route(spot_id=spot.id, name="Cumbre", slug="cumbre")
    db.add(route)
    db.commit()
    assert client.patch(f"/routes/{route.id}", json={"distance_km": 1}, headers=as_user(OTHER)).status_code == 403
    assert client.patch(f"/routes/{route.id}", json={"distance_km": 1}, headers=as_user(ADMIN)).status_code == 200
    assert client.patch(f"/routes/{route.id}", json={"name": "  "}, headers=as_user(OWNER)).status_code == 422


def test_editar_una_ruta_en_revision(client, db, make_spot):
    spot = make_spot(name="Cerro", category="Trekking")
    route = Route(spot_id=spot.id, name="Cumbre", slug="cumbre", is_approved=False)
    db.add(route)
    db.commit()
    assert client.patch(f"/routes/{route.id}", json={"distance_km": 2}, headers=as_user(OWNER)).status_code == 200


def test_editar_una_experiencia_sin_tocar_su_categoria(client, db, make_spot):
    spot = make_spot(name="Camping")
    cat = Category(name="Cabalgatas")
    db.add(cat)
    db.flush()
    exp = Experience(spot_id=spot.id, category_id=cat.id, title="Cabalgata", price=900, currency="UYU", is_active=True)
    db.add(exp)
    db.commit()
    r = client.patch(f"/spots/{spot.id}/experiences/{exp.id}", json={"title": "Cabalgata al atardecer", "price": 1200}, headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    assert (r.json()["title"], r.json()["price"], r.json()["currency"], r.json()["category_id"]) == ("Cabalgata al atardecer", 1200, "UYU", cat.id)
    otro = make_spot(name="Otro")
    assert client.patch(f"/spots/{otro.id}/experiences/{exp.id}", json={"price": 1}, headers=as_user(OWNER)).status_code == 404


def test_editar_un_alojamiento_de_glamping(client, db, make_spot):
    spot = make_spot(name="Domos", category="Glamping")
    unit = GlampingDetail(spot_id=spot.id, accommodation_type="domo", capacity=2, price_per_night=3000)
    db.add(unit)
    db.commit()
    r = client.patch(f"/glamping/units/{unit.id}", json={"price_per_night": 3500}, headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    assert (r.json()["price_per_night"], r.json()["capacity"]) == (3500, 2)
    assert client.patch(f"/glamping/units/{unit.id}", json={"capacity": 9}, headers=as_user(OTHER)).status_code == 403


def test_caracteristicas_del_trekking_se_crean_o_se_corrigen(client, db, make_spot):
    spot = make_spot(name="Cerro", category="Trekking")
    r = client.put(f"/spots/{spot.id}/trekking-detail", json={"bathrooms": True, "fire_pits": False}, headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    r = client.put(f"/spots/{spot.id}/trekking-detail", json={"bathrooms": None}, headers=as_user(OWNER))
    content = client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OWNER)).json()
    assert (content["trekking_detail"]["bathrooms"], content["trekking_detail"]["fire_pits"]) == (None, False)


def test_servicios_del_motorhome(client, make_spot):
    spot = make_spot(name="Parada", category="Motorhome")
    client.put(f"/spots/{spot.id}/motorhome-detail", json={"has_water": True, "has_dump_station": False}, headers=as_user(OWNER))
    client.put(f"/spots/{spot.id}/motorhome-detail", json={"has_electricity": True}, headers=as_user(OWNER))
    detail = client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OWNER)).json()["motorhome_detail"]
    assert (detail["has_water"], detail["has_electricity"], detail["has_dump_station"]) == (True, True, False)


def test_servicios_del_camping_quedan_exactamente_esos(client, db, make_spot):
    spot = make_spot(name="Camping")
    a, b, c = Amenity(name="WiFi"), Amenity(name="Duchas"), Amenity(name="Parrilleros")
    db.add_all([a, b, c])
    db.commit()
    client.put(f"/spots/{spot.id}/camping-amenities", json={"amenity_ids": [a.id, b.id]}, headers=as_user(OWNER))
    r = client.put(f"/spots/{spot.id}/camping-amenities", json={"amenity_ids": [b.id, c.id]}, headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    assert client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OWNER)).json()["amenity_ids"] == sorted([b.id, c.id])
    assert client.put(f"/spots/{spot.id}/camping-amenities", json={"amenity_ids": [999]}, headers=as_user(OWNER)).status_code == 422
    assert client.put(f"/spots/{spot.id}/camping-amenities", json={"amenity_ids": []}, headers=as_user(OTHER)).status_code == 403
