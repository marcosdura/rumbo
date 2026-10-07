"""Datos nuevos para el visitante: todos opcionales, None = "no sé"."""
from conftest import ADMIN, as_user


# -------- Sectores de escalada --------

def test_un_sector_guarda_aproximacion_sol_y_roca(client, make_spot):
    spot = make_spot(category="Escalada")
    r = client.post("/sectors/", json={
        "spot_id": spot.id, "name": "Placa Sur",
        "approach_minutes": 25, "sun_exposure": "sombra", "rock_type": "granito",
    }, headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    sector = client.get(f"/sectors/by-slug/{r.json()['slug']}").json()
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
