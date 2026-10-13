"""Búsqueda de surf y kayak: las escuelas y servicios son lugares con sus
datos propios; las playas y lagunas, lugares sin esos datos."""
from models import KayakServiceDetail, SpotCategory, SurfDetail


def ids(client, **params):
    r = client.get("/spots", params=params)
    assert r.status_code == 200, r.text
    return [s["name"] for s in r.json()]


def world(db, make_spot):
    # Alfabéticamente va primero: tiene que quedar después de las escuelas.
    playa = make_spot(name="Aguas Dulces", category="Surf")
    grupal = make_spot(name="Escuela Grupal", category="Surf")
    privada = make_spot(name="Escuela Privada", category="Surf")
    en_revision = make_spot(name="Escuela Nueva", category="Surf", approved=False)
    db.add_all([
        SurfDetail(spot_id=grupal.id, class_type="grupal", duration=1.5, equipment_include=True),
        SurfDetail(spot_id=privada.id, class_type="privada", duration=3, equipment_include=False),
        SurfDetail(spot_id=en_revision.id, class_type="grupal"),
    ])
    laguna = make_spot(name="Arroyo", category="Kayak")
    kayak = make_spot(name="Kayak Sur", category="Kayak")
    db.add(KayakServiceDetail(spot_id=kayak.id, water_type="lago", rental_available=True))
    # La actividad de cada lugar (la búsqueda filtra por esto).
    for spot in (playa, grupal, privada, en_revision, laguna, kayak):
        db.add(SpotCategory(spot_id=spot.id, category_id=spot.category_id, is_primary=True))
    db.commit()


def test_en_surf_primero_las_escuelas_y_despues_las_playas(client, db, make_spot):
    world(db, make_spot)
    names = ids(client, activity="Surf", sort="name")
    assert names == ["Escuela Grupal", "Escuela Privada", "Aguas Dulces"]


def test_los_filtros_de_surf_son_de_las_escuelas(client, db, make_spot):
    world(db, make_spot)
    assert ids(client, activity="Surf", class_type="grupal") == ["Escuela Grupal"]
    assert ids(client, activity="Surf", surf_duration="larga") == []
    assert ids(client, activity="Surf", surf_duration="media") == ["Escuela Privada"]
    assert ids(client, activity="Surf", equipment_included="true") == ["Escuela Grupal"]


def test_solo_escuelas_saca_las_playas(client, db, make_spot):
    world(db, make_spot)
    assert sorted(ids(client, activity="Surf", has_surf_school="true")) == ["Escuela Grupal", "Escuela Privada"]


def test_kayak(client, db, make_spot):
    world(db, make_spot)
    assert ids(client, activity="Kayak", sort="name") == ["Kayak Sur", "Arroyo"]
    assert ids(client, activity="Kayak", water_type="lago") == ["Kayak Sur"]
    assert ids(client, activity="Kayak", rental_available="true") == ["Kayak Sur"]
    assert ids(client, activity="Kayak", water_type="mar") == []
