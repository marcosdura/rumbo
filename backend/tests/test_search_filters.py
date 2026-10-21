"""Cada filtro de la búsqueda (spot_search.py), con un lugar de cada caso:
qué lugares quedan para cada combinación. Se armó para partir
build_spots_filter_query sin cambiar ningún resultado."""

from models import (Amenity, ClimbingRoute, ClimbingSector, GlampingAmenity, GlampingDetail, KayakServiceDetail,
                    MotorhomeDetail, Review, Route, SpotAmenity, SpotCategory, SpotDB, SurfDetail, TrekkingDetail, User)

EXPECTED = [
    ({}, ['Camp 0', 'Camp 1', 'Camp 2', 'Glamp 0', 'Glamp 1', 'Kayak 0', 'Kayak 1', 'Kayak 2', 'Motor 0', 'Motor 1', 'Roca 0', 'Roca 1', 'Roca 2', 'Surf 0', 'Surf 1', 'Surf 2', 'Trek 0', 'Trek 1', 'Trek 2', 'Trek 3']),
    ({'department': 'Rocha'}, ['Camp 0', 'Camp 1', 'Camp 2', 'Glamp 0', 'Glamp 1', 'Kayak 0', 'Kayak 1', 'Kayak 2', 'Motor 0', 'Motor 1', 'Roca 0', 'Roca 1', 'Roca 2', 'Surf 0', 'Surf 1', 'Surf 2', 'Trek 1', 'Trek 3']),
    ({'activity': 'Trekking'}, ['Trek 0', 'Trek 1', 'Trek 2', 'Trek 3']),
    ({'activity': 'Trekking,Camping'}, ['Camp 0', 'Camp 1', 'Camp 2', 'Trek 0', 'Trek 1', 'Trek 2', 'Trek 3']),
    ({'activity': 'Trekking', 'difficulty': 'fácil'}, ['Trek 0']),
    ({'activity': 'Trekking', 'difficulty': ['fácil', 'difícil']}, ['Trek 0', 'Trek 2']),
    ({'activity': 'Trekking', 'duration': 'corta'}, ['Trek 0']),
    ({'activity': 'Trekking', 'duration': ['media', 'larga']}, ['Trek 1', 'Trek 2', 'Trek 3']),
    ({'activity': 'Trekking', 'distance': 'corta'}, ['Trek 0']),
    ({'activity': 'Trekking', 'distance': 'larga'}, ['Trek 2']),
    ({'activity': 'Trekking', 'difficulty': 'moderado', 'distance': 'media', 'duration': 'media'}, ['Trek 1', 'Trek 3']),
    ({'activity': 'Trekking', 'parking': 'true'}, ['Trek 0', 'Trek 3']),
    ({'activity': 'Trekking', 'parking': 'false'}, ['Trek 1']),
    ({'activity': 'Trekking', 'bathrooms': 'true', 'kids_friendly': 'true'}, ['Trek 0']),
    ({'activity': 'Trekking', 'camping_amenity': 'true'}, ['Trek 3']),
    ({'pet_friendly': 'true'}, ['Trek 0', 'Trek 3']),
    ({'pet_friendly': 'false'}, ['Trek 1']),
    ({'reservation_required': 'true'}, ['Trek 1', 'Trek 3']),
    ({'cell_signal': 'false'}, ['Trek 2']),
    ({'activity': 'Kayak'}, ['Kayak 0', 'Kayak 1', 'Kayak 2']),
    ({'activity': 'Kayak', 'water_type': 'rio'}, ['Kayak 0']),
    ({'activity': 'Kayak', 'kayak_difficulty': 'facil'}, ['Kayak 0']),
    ({'activity': 'Kayak', 'kayak_duration': 'corta'}, ['Kayak 0']),
    ({'activity': 'Kayak', 'rental_available': 'true'}, ['Kayak 0']),
    ({'activity': 'Surf'}, ['Surf 0', 'Surf 1', 'Surf 2']),
    ({'activity': 'Surf', 'class_type': 'grupal'}, ['Surf 0']),
    ({'activity': 'Surf', 'surf_duration': 'media'}, ['Surf 0']),
    ({'activity': 'Surf', 'equipment_included': 'true'}, ['Surf 0']),
    ({'activity': 'Surf', 'has_surf_school': 'true'}, ['Surf 0', 'Surf 1']),
    ({'activity': 'Escalada'}, ['Roca 0', 'Roca 1', 'Roca 2']),
    ({'activity': 'Escalada', 'climbing_type': 'deportiva'}, ['Roca 0', 'Roca 2']),
    ({'activity': 'Escalada', 'grade_range': 'principiante'}, ['Roca 0']),
    ({'activity': 'Escalada', 'grade_range': ['avanzado', 'experto']}, ['Roca 1', 'Roca 2']),
    ({'activity': 'Escalada', 'no_restrictions': 'true'}, ['Roca 0', 'Roca 2']),
    ({'activity': 'Escalada', 'climbing_type': 'boulder', 'grade_range': 'intermedio'}, ['Roca 1']),
    ({'activity': 'Camping'}, ['Camp 0', 'Camp 1', 'Camp 2']),
    ({'activity': 'Camping', 'amenity_ids': '1'}, ['Camp 0', 'Camp 1']),
    ({'activity': 'Camping', 'amenity_ids': ['1', '2']}, ['Camp 1']),
    ({'activity': 'Camping', 'price_range': 'gratis'}, ['Camp 0']),
    ({'activity': 'Camping', 'price_range': ['medio', 'alto']}, ['Camp 1', 'Camp 2']),
    ({'activity': 'Glamping', 'glamping_price': 'bajo'}, ['Glamp 0']),
    ({'activity': 'Glamping', 'glamping_amenity': 'wifi'}, ['Glamp 0']),
    ({'activity': 'Motorhome', 'motorhome_service': ['water', 'dump']}, ['Motor 0']),
    ({'activity': 'Trekking', 'sort': 'rating'}, ['Trek 0', 'Trek 1', 'Trek 2', 'Trek 3']),
]


def seed(db, make_spot):
    db.add_all([Amenity(id=1, name="Ducha"), Amenity(id=2, name="Wifi")])
    db.add(User(id="u@t.com", email="u@t.com"))
    db.flush()
    for i in range(4):
        t = make_spot(name=f"Trek {i}", category="Trekking", department="Rocha" if i % 2 else "Lavalleja",
                      pets_allowed=[True, False, None, True][i], reservation_required=bool(i % 2), cell_signal=i != 2)
        db.add_all([
            Route(spot_id=t.id, name=f"R{i}a", slug=f"r{i}a", difficulty=["fácil", "moderado", "difícil", "moderado"][i],
                  duration_hours=[1, 3, 6, 4][i], distance_km=[3, 10, 20, 8][i]),
            TrekkingDetail(spot_id=t.id, parking=[True, False, None, True][i], bathrooms=i < 2, kids_friendly=i != 1, fire_pits=i == 3),
        ])
        db.add(Review(spot_id=t.id, user_id="u@t.com", rating=i + 2))
    for i in range(3):
        k = make_spot(name=f"Kayak {i}", category="Kayak")
        if i < 2:
            db.add(KayakServiceDetail(spot_id=k.id, water_type=["rio", "mar"][i], difficulty=["facil", "dificil"][i],
                                      duration=[1, 3][i], rental_available=[True, False][i]))
    for i in range(3):
        s = make_spot(name=f"Surf {i}", category="Surf")
        if i < 2:
            db.add(SurfDetail(spot_id=s.id, class_type=["grupal", "privada"][i], duration=[3, 1][i], equipment_include=[True, None][i]))
    for i in range(3):
        c = make_spot(name=f"Roca {i}", category="Escalada")
        sec = ClimbingSector(spot_id=c.id, name=f"S{i}", slug=f"s{i}", type=["deportiva", "boulder", "deportiva"][i],
                             restrictions=[None, "Cerrado en primavera", ""][i])
        db.add(sec)
        db.flush()
        db.add_all([ClimbingRoute(sector_id=sec.id, name=f"V{i}{j}", grade=g) for j, g in enumerate([["5a", "6b"], ["6c+", "7b"], ["8a"]][i])])
    for i in range(3):
        c = make_spot(name=f"Camp {i}", category="Camping", price=[0, 500, 1000][i])
        for a in [[1], [1, 2], []][i]:
            db.add(SpotAmenity(spot_id=c.id, amenity_id=a))
    for i in range(2):
        g = make_spot(name=f"Glamp {i}", category="Glamping")
        unit = GlampingDetail(spot_id=g.id, price_per_night=[2000, 7000][i])
        db.add(unit)
        db.flush()
        db.add(GlampingAmenity(spot_id=g.id, glamping_id=unit.id, wifi=i == 0))
    for i in range(2):
        m = make_spot(name=f"Motor {i}", category="Motorhome")
        db.add(MotorhomeDetail(spot_id=m.id, has_water=True, has_dump_station=i == 0))
    for spot in db.query(SpotDB):
        db.add(SpotCategory(spot_id=spot.id, category_id=spot.category_id, is_primary=True))
    db.commit()


def test_cada_filtro_deja_los_lugares_que_corresponden(client, db, make_spot):
    seed(db, make_spot)
    wrong = []
    for query, expected in EXPECTED:
        r = client.get("/spots", params={"limit": 50, **query})
        assert r.status_code == 200, (query, r.text)
        got = sorted(s["name"] for s in r.json())
        if got != expected:
            wrong.append((query, expected, got))
    assert wrong == []


def test_ordenar_por_puntaje_pone_primero_las_mejor_resenadas(client, db, make_spot):
    seed(db, make_spot)
    names = [s["name"] for s in client.get("/spots", params={"activity": "Trekking", "sort": "rating"}).json()]
    assert names == ["Trek 3", "Trek 2", "Trek 1", "Trek 0"]
