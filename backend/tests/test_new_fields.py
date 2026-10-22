"""Datos nuevos para el visitante: todos opcionales, None = "no sé"."""
from conftest import ADMIN, as_user
from models import SpotCategory


# -------- Sectores de escalada --------

def test_un_sector_guarda_aproximacion_sol_y_roca(client, make_spot):
    spot = make_spot(category="Escalada")
    r = client.post("/sectors/", json={
        "spot_id": spot.id, "name": "Placa Sur",
        "approach_minutes": 25, "sun_exposure": "sombra", "rock_type": "granito",
    }, headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    sector = client.get(f"/sectors/{r.json()['id']}").json()
    assert (sector["approach_minutes"], sector["sun_exposure"], sector["rock_type"]) == (25, "sombra", "granito")


def test_un_sector_sin_esos_datos_queda_en_no_se(client, make_spot):
    spot = make_spot(category="Escalada")
    r = client.post("/sectors/", json={"spot_id": spot.id, "name": "Placa Norte"}, headers=as_user(ADMIN))
    assert (r.json()["approach_minutes"], r.json()["sun_exposure"], r.json()["rock_type"]) == (None, None, None)


def test_un_sector_rechaza_valores_que_no_existen(client, make_spot):
    spot = make_spot(category="Escalada")
    for bad in ({"sun_exposure": "nublado"}, {"rock_type": "plastico"}, {"approach_minutes": -5}):
        r = client.post("/sectors/", json={"spot_id": spot.id, "name": "X", **bad}, headers=as_user(ADMIN))
        assert r.status_code == 422, bad


# -------- Información práctica de cualquier lugar --------

def test_un_lugar_guarda_mascotas_reserva_y_senial(client, make_spot):
    spot = make_spot(approved=False, pets_allowed=True, reservation_required=False)
    r = client.get("/spots/mine", headers=as_user(spot.owner_email)).json()[0]
    assert (r["pets_allowed"], r["reservation_required"], r["cell_signal"]) == (True, False, None)


def test_el_duenio_los_edita_al_instante(client, db, make_spot):
    spot = make_spot()
    r = client.patch(f"/admin/spots/{spot.id}", json={"pets_allowed": False, "cell_signal": True}, headers=as_user(spot.owner_email))
    assert sorted(r.json()["applied"]) == ["cell_signal", "pets_allowed"]
    assert r.json()["pending"] == []
    page = client.get(f"/spots/{spot.id}").json()
    assert (page["pets_allowed"], page["cell_signal"], page["reservation_required"]) == (False, True, None)


def test_el_filtro_de_mascotas_vale_para_cualquier_actividad(client, db, make_spot):
    for name, pets in (("Camping con perros", True), ("Camping sin perros", False), ("Camping no se", None)):
        spot = make_spot(name=name, category="Camping", pets_allowed=pets)
        db.add(SpotCategory(spot_id=spot.id, category_id=spot.category_id, is_primary=True))
    db.commit()
    r = client.get("/spots", params={"activity": "Camping", "pet_friendly": "true"})
    assert [s["name"] for s in r.json()] == ["Camping con perros"]
