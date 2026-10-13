"""Lo propio de una escuela de surf o un servicio de kayak, que son lugares
(PUT /spots/{id}/surf-detail y /kayak-detail)."""
from conftest import ADMIN, OTHER, OWNER, as_user
from models import KayakServiceDetail, SurfDetail


def test_el_duenio_carga_y_edita_lo_de_su_escuela(client, db, make_spot):
    # Recién cargada (en revisión): el dueño le suma sus datos.
    spot = make_spot(name="Escuela Ola", category="Surf", approved=False)
    body = {"class_type": "grupal", "duration": 1.5, "equipment_include": True, "levels": ["principiante"],
            "languages": ["espanol", "ingles"], "price_note": "por clase", "operates_at": "  Playa   El Emir "}
    r = client.put(f"/spots/{spot.id}/surf-detail", json=body, headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    assert r.json()["operates_at"] == "Playa El Emir"
    # Aprobada, la sigue editando su dueño (no es una playa): cambia solo lo que se manda.
    spot.is_approved = True
    db.commit()
    client.put(f"/spots/{spot.id}/surf-detail", json={"levels": None, "duration": 2}, headers=as_user(OWNER))
    db.expire_all()
    d = db.query(SurfDetail).filter_by(spot_id=spot.id).one()
    assert (d.class_type, d.duration, d.levels, d.languages) == ("grupal", 2, None, ["espanol", "ingles"])


def test_kayak(client, db, make_spot):
    spot = make_spot(name="Kayak Sur", category="Kayak", approved=False)
    r = client.put(f"/spots/{spot.id}/kayak-detail", json={"water_type": "lago", "rental_available": None, "operates_at": "Laguna Garzón"}, headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    d = db.query(KayakServiceDetail).filter_by(spot_id=spot.id).one()
    assert (d.water_type, d.rental_available, d.operates_at) == ("lago", None, "Laguna Garzón")


def test_solo_el_duenio_o_el_admin(client, make_spot):
    spot = make_spot(name="Escuela Ola", category="Surf")
    assert client.put(f"/spots/{spot.id}/surf-detail", json={}, headers=as_user(OTHER)).status_code == 403


def test_solo_en_lugares_de_esa_actividad(client, make_spot):
    camping = make_spot(name="Camping", category="Camping")
    r = client.put(f"/spots/{camping.id}/surf-detail", json={"class_type": "grupal"}, headers=as_user(OWNER))
    assert r.status_code == 422
    assert "no es de Surf" in r.json()["detail"]


def test_valores_cerrados(client, make_spot):
    spot = make_spot(name="Kayak Sur", category="Kayak", approved=False)
    for bad in ({"water_type": "pileta"}, {"difficulty": "extrema"}, {"duration": -1}, {"operates_at": "x" * 201}):
        assert client.put(f"/spots/{spot.id}/kayak-detail", json=bad, headers=as_user(OWNER)).status_code == 422, bad


def test_una_playa_aprobada_sigue_siendo_del_admin(client, make_spot):
    """Sin datos de escuela es una playa: aprobada, ni quien la cargó la edita."""
    playa = make_spot(name="Playa Brava", category="Surf")
    assert client.put(f"/spots/{playa.id}/surf-detail", json={"class_type": "grupal"}, headers=as_user(OWNER)).status_code == 403
    assert client.put(f"/spots/{playa.id}/surf-detail", json={}, headers=as_user(ADMIN)).status_code == 200


def test_la_pagina_del_lugar_trae_los_datos_de_la_escuela(client, db, make_spot):
    spot = make_spot(name="Escuela Ola", category="Surf", slug="escuela-ola")
    db.add(SurfDetail(spot_id=spot.id, class_type="grupal", levels=["principiante"], operates_at="Playa El Emir"))
    db.commit()
    body = client.get("/spots/by-slug/escuela-ola").json()
    assert body["surf_detail"]["class_type"] == "grupal"
    assert body["surf_detail"]["operates_at"] == "Playa El Emir"
    assert body["kayak_service_detail"] is None
    assert client.get(f"/spots/{spot.id}").json()["surf_detail"]["levels"] == ["principiante"]


def test_el_panel_del_duenio_trae_los_datos_para_editarlos(client, db, make_spot):
    spot = make_spot(name="Kayak Sur", category="Kayak", approved=False)
    db.add(KayakServiceDetail(spot_id=spot.id, water_type="mar"))
    db.commit()
    content = client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OWNER)).json()
    assert content["kayak_service_detail"]["water_type"] == "mar"
    assert content["surf_detail"] is None


def test_las_direcciones_viejas_llevan_al_lugar(client, db, make_spot):
    spot = make_spot(name="Escuela Ola", category="Surf", slug="escuela-ola")
    oculto = make_spot(name="Kayak Oculto", category="Kayak", slug="kayak-oculto", approved=False)
    db.add_all([SurfDetail(spot_id=spot.id, legacy_id=7), KayakServiceDetail(spot_id=oculto.id, legacy_id=9)])
    db.commit()
    assert client.get("/spots/legacy/surf/7").json() == {"slug": "escuela-ola"}
    assert client.get("/spots/legacy/kayak/7").status_code == 404
    assert client.get("/spots/legacy/kayak/9").status_code == 404, "sin publicar no se redirige"
    assert client.get("/spots/legacy/otra/7").status_code == 404


def test_escuelas_cerca_de_una_playa(client, db, make_spot):
    playa = make_spot(name="Playa Brava", category="Surf", lat=-34.96, lng=-54.94)
    escuela = make_spot(name="Escuela Cerca", category="Surf", lat=-34.95, lng=-54.93)
    make_spot(name="Camping Cerca", category="Camping", lat=-34.95, lng=-54.92)
    lejos = make_spot(name="Escuela Lejos", category="Surf", lat=-33.0, lng=-54.0)
    db.add_all([SurfDetail(spot_id=escuela.id, price_note="por clase"), SurfDetail(spot_id=lejos.id)])
    db.commit()
    near = client.get(f"/spots/{playa.id}/nearby", params={"services": "surf"}).json()
    assert [s["name"] for s in near] == ["Escuela Cerca"]
    # La card muestra el precio con su aclaración.
    assert near[0]["surf_detail"]["price_note"] == "por clase"
    assert sorted(s["name"] for s in client.get(f"/spots/{playa.id}/nearby").json()) == ["Camping Cerca", "Escuela Cerca"]
    assert client.get(f"/spots/{playa.id}/nearby", params={"services": "otra"}).status_code == 422
