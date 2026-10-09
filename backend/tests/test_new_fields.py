"""Datos nuevos para el visitante: todos opcionales, None = "no sé"."""
from conftest import ADMIN, as_user
from models import KayakDetail, SpotCategory, SurfSchool


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


# -------- Escuelas de surf y servicios de kayak --------

OPERATOR = "operador@test.com"


def test_una_escuela_guarda_niveles_e_idiomas(client, make_spot):
    beach = make_spot(name="Playa Brava", category="Surf")
    r = client.post("/surfschool/", json={
        "spot_id": beach.id, "name": "Escuela Ola", "levels": ["principiante", "intermedio"], "languages": ["espanol", "ingles"],
    }, headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    school = client.get(f"/surfschool/{r.json()['id']}").json()
    assert (school["levels"], school["languages"]) == (["principiante", "intermedio"], ["espanol", "ingles"])


def test_una_escuela_sin_esos_datos_queda_en_no_se(client, make_spot):
    beach = make_spot(name="Playa Brava", category="Surf")
    r = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Escuela Ola"}, headers=as_user(ADMIN))
    assert (r.json()["levels"], r.json()["languages"]) == (None, None)


def test_una_escuela_rechaza_niveles_o_idiomas_que_no_existen(client, make_spot):
    beach = make_spot(name="Playa Brava", category="Surf")
    for bad in ({"levels": ["experto"]}, {"languages": ["klingon"]}):
        r = client.post("/surfschool/", json={"spot_id": beach.id, "name": "X", **bad}, headers=as_user(ADMIN))
        assert r.status_code == 422, bad


def test_escuelas_y_kayaks_traen_slug_y_ubicacion_de_su_playa(client, make_spot):
    # Para llevar a la playa y a "Cómo llegar" desde su página.
    beach = make_spot(name="Playa Brava", category="Surf", slug="playa-brava", lat=-34.96, lng=-54.94)
    lake = make_spot(name="Laguna", category="Kayak", slug="laguna", lat=-34.6, lng=-54.2)
    school = client.post("/surfschool/", json={"spot_id": beach.id, "name": "Escuela Ola"}, headers=as_user(ADMIN)).json()
    kayak = client.post("/kayak/", json={"spot_id": lake.id, "name": "Kayak Sur"}, headers=as_user(ADMIN)).json()
    s = client.get(f"/surfschool/{school['id']}").json()
    k = client.get(f"/kayak/{kayak['id']}").json()
    assert (s["spot_slug"], s["spot_lat"], s["spot_lng"]) == ("playa-brava", -34.96, -54.94)
    assert (k["spot_slug"], k["spot_lat"], k["spot_lng"]) == ("laguna", -34.6, -54.2)


def test_un_kayak_guarda_guia_y_chaleco(client, make_spot):
    lake = make_spot(name="Laguna", category="Kayak")
    r = client.post("/kayak/", json={"spot_id": lake.id, "name": "Kayak Sur", "includes_guide": True, "includes_life_jacket": False}, headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    assert (r.json()["includes_guide"], r.json()["includes_life_jacket"]) == (True, False)


def test_el_duenio_los_edita_al_instante_y_puede_volver_a_no_se(client, db, make_spot):
    beach = make_spot(name="Playa Brava", category="Surf")
    school = SurfSchool(spot_id=beach.id, name="Escuela Ola", owner_email=OPERATOR, levels=["avanzado"])
    lake = make_spot(name="Laguna", category="Kayak")
    kayak = KayakDetail(spot_id=lake.id, name="Kayak Sur", owner_email=OPERATOR)
    db.add_all([school, kayak])
    db.commit()

    r = client.patch(f"/operators/surf_school/{school.id}", json={"levels": None, "languages": ["portugues"]}, headers=as_user(OPERATOR))
    assert sorted(r.json()["applied"]) == ["languages", "levels"]
    r = client.patch(f"/operators/kayak/{kayak.id}", json={"includes_guide": True}, headers=as_user(OPERATOR))
    assert r.json()["applied"] == ["includes_guide"]
    db.expire_all()
    assert (db.get(SurfSchool, school.id).levels, db.get(SurfSchool, school.id).languages) == (None, ["portugues"])
    assert db.get(KayakDetail, kayak.id).includes_guide is True


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
