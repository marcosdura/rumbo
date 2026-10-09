"""Página principal (home.py): populares, recién agregados, colecciones del
día, y las visitas (views.py)."""
from datetime import date, datetime, timedelta, timezone

import home
from conftest import OWNER, as_user
from models import Favorite, Review, SpotCategory, SpotView, User

NOW = datetime(2026, 10, 7, 12, tzinfo=timezone.utc)


def user(db, n):
    u = User(id=f"u{n}", email=f"u{n}@test.com")
    db.add(u)
    db.flush()
    return u


def fav(db, spot, u, days_ago=1):
    db.add(Favorite(user_id=u.id, spot_id=spot.id, created_at=NOW - timedelta(days=days_ago)))


def review(db, spot, u, rating=5, days_ago=1):
    db.add(Review(user_id=u.id, spot_id=spot.id, rating=rating, created_at=NOW - timedelta(days=days_ago)))


def spots_with_category(db, make_spot, category, department, n, prefix):
    created = []
    for i in range(n):
        s = make_spot(name=f"{prefix} {i}", category=category, department=department)
        db.add(SpotCategory(spot_id=s.id, category_id=s.category_id, is_primary=True))
        created.append(s)
    db.commit()
    return created


# -------- Populares --------

def test_populares_por_favoritos_y_resenias_recientes(db, make_spot):
    a, b, c = make_spot(name="A"), make_spot(name="B"), make_spot(name="C")
    users = [user(db, i) for i in range(4)]
    for u in users[:3]:
        fav(db, a, u)                       # A: 3 favoritos recientes
    review(db, b, users[0], rating=5)
    review(db, b, users[1], rating=5)       # B: 2 reseñas de 5★ (valen 2 c/u)
    for u in users:
        fav(db, c, u, days_ago=170)         # C: 4 favoritos viejos: más que A, pero casi no pesan
    db.commit()
    scores = home.popularity(db, NOW)
    assert sorted(scores, key=lambda s: -scores[s]) == [b.id, a.id, c.id]


def test_no_cuentan_los_del_duenio_ni_una_sola_senial(db, make_spot):
    owner = User(id="owner", email=OWNER)
    db.add(owner)
    a, b = make_spot(name="A"), make_spot(name="B")
    u = user(db, 1)
    fav(db, a, owner)
    review(db, a, owner)                    # del dueño: no cuentan
    fav(db, b, u)                           # una sola señal: no alcanza
    db.commit()
    assert home.popularity(db, NOW) == {}


def test_lo_que_queda_fuera_de_la_ventana_no_cuenta(db, make_spot):
    a = make_spot(name="A")
    for i in range(3):
        fav(db, a, user(db, i), days_ago=200)
    db.commit()
    assert home.popularity(db, NOW) == {}


def test_si_no_alcanzan_se_completa_con_otros(db, make_spot):
    spots = [make_spot(name=f"L{i}") for i in range(10)]
    for i in range(2):
        fav(db, spots[5], user(db, i))
    db.commit()
    ids = home.popular_ids(db, home.daily_rng(date(2026, 10, 7), "populares"), NOW)
    assert ids[0] == spots[5].id
    assert len(ids) == home.SECTION_SIZE
    assert len(set(ids)) == home.SECTION_SIZE


# -------- Colecciones --------

def test_solo_colecciones_con_al_menos_3_lugares(db, make_spot):
    spots_with_category(db, make_spot, "Surf", "Rocha", 3, "Playa")
    spots_with_category(db, make_spot, "Escalada", "Lavalleja", 2, "Cerro")
    names = {(c["kind"], c["name"]) for c in home.eligible_collections(db)}
    assert names == {("department", "Rocha"), ("category", "Surf")}


def test_las_colecciones_rotan_por_dia_y_son_estables_en_el_dia(db, make_spot):
    for i, dep in enumerate(["Rocha", "Lavalleja", "Maldonado", "Colonia", "Salto", "Florida"]):
        spots_with_category(db, make_spot, ["Surf", "Escalada", "Camping", "Kayak", "Trekking", "Glamping"][i], dep, 3, dep)
    day = date(2026, 10, 7)
    first = [c["key"] for c in home.pick_collections(db, day)]
    assert len(first) == home.RANDOM_COLLECTIONS
    assert first == [c["key"] for c in home.pick_collections(db, day)]
    other_days = {tuple(c["key"] for c in home.pick_collections(db, day + timedelta(days=d))) for d in range(1, 8)}
    assert len(other_days | {tuple(first)}) > 1


# -------- GET /home --------

def test_home_trae_populares_arriba_recientes_y_colecciones(client, db, make_spot):
    spots_with_category(db, make_spot, "Surf", "Rocha", 3, "Playa")
    data = client.get("/home").json()
    assert data["stats"] == {"spots": 3, "departments": 1}
    keys = [s["key"] for s in data["sections"]]
    assert keys[:2] == ["popular", "recent"]
    assert set(keys[2:]) == {"department:Rocha", "category:Surf"}
    surf = next(s for s in data["sections"] if s["key"] == "category:Surf")
    assert surf["href"] == "/search?activity=Surf" and surf["total"] == 3
    assert {sp["name"] for sp in surf["spots"]} == {"Playa 0", "Playa 1", "Playa 2"}


def test_home_sin_lugares_no_muestra_secciones_vacias(client):
    assert client.get("/home").json() == {"stats": {"spots": 0, "departments": 0}, "sections": []}


def test_home_no_muestra_lugares_sin_aprobar(client, make_spot):
    make_spot(name="Pendiente", approved=False)
    assert client.get("/home").json()["sections"] == []


# -------- Visitas --------

BROWSER = {"user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120"}


def test_una_visita_por_persona_por_dia(client, db, make_spot):
    spot = make_spot()
    for _ in range(3):
        assert client.post(f"/spots/{spot.id}/view", headers=BROWSER).status_code == 204
    client.post(f"/spots/{spot.id}/view", headers={**BROWSER, **as_user("ana@test.com")})
    assert db.query(SpotView).filter_by(spot_id=spot.id).count() == 2
    # No se guarda la IP ni el email: solo un hash.
    assert all(len(v.viewer_hash) == 64 for v in db.query(SpotView).all())


def test_los_bots_no_cuentan(client, db, make_spot):
    spot = make_spot()
    client.post(f"/spots/{spot.id}/view", headers={"user-agent": "Googlebot/2.1"})
    assert db.query(SpotView).count() == 0


def test_un_lugar_sin_publicar_no_registra_visitas(client, make_spot):
    spot = make_spot(approved=False)
    assert client.post(f"/spots/{spot.id}/view", headers=BROWSER).status_code == 404


# -------- Cerca de acá (página del lugar) --------

# Cerca de La Paloma: 0.01° de latitud son ~1.1 km.
LAT, LNG = -34.66, -54.16


def test_cercanos_del_mas_cercano_al_mas_lejano_con_la_distancia(client, make_spot):
    base = make_spot(name="Base", lat=LAT, lng=LNG)
    make_spot(name="A 11 km", lat=LAT + 0.1, lng=LNG)
    make_spot(name="A 2 km", lat=LAT + 0.02, lng=LNG)
    make_spot(name="A 33 km", lat=LAT + 0.3, lng=LNG)        # fuera del radio
    # En la esquina del recuadro de búsqueda pero a ~31 km: fuera del radio.
    make_spot(name="Esquina", lat=LAT + 0.2, lng=LNG + 0.25)
    make_spot(name="Sin publicar", lat=LAT + 0.01, lng=LNG, approved=False)
    make_spot(name="Sin ubicación")
    r = client.get(f"/spots/{base.id}/nearby")
    assert r.status_code == 200, r.text
    assert [(s["name"], s["distance_km"]) for s in r.json()] == [("A 2 km", 2.2), ("A 11 km", 11.1)]
    # Como los muestra la card.
    assert {"slug", "images", "categories", "review_count"} <= set(r.json()[0])


def test_cercanos_hasta_cuatro(client, make_spot):
    base = make_spot(name="Base", lat=LAT, lng=LNG)
    for i in range(1, 7):
        make_spot(name=f"Cerca {i}", lat=LAT + 0.01 * i, lng=LNG)
    assert [s["name"] for s in client.get(f"/spots/{base.id}/nearby").json()] == ["Cerca 1", "Cerca 2", "Cerca 3", "Cerca 4"]


def test_cercanos_sin_ubicacion_o_sin_publicar(client, make_spot):
    sin_ubicacion = make_spot(name="Sin ubicación")
    assert client.get(f"/spots/{sin_ubicacion.id}/nearby").json() == []
    oculto = make_spot(name="Oculto", lat=LAT, lng=LNG, approved=False)
    assert client.get(f"/spots/{oculto.id}/nearby").status_code == 404


# -------- Estadísticas para el panel del dueño --------

def test_visitas_de_los_ultimos_30_dias_y_favoritos(client, db, make_spot):
    from datetime import date, timedelta
    import views
    spot = make_spot(name="Lugar")
    otro = make_spot(name="Otro")
    today = date.today()
    for i, days_ago in enumerate((0, 5, 29, 30, 60)):
        views.record_view(db, spot.id, f"persona{i}", today - timedelta(days=days_ago))
    views.record_view(db, otro.id, "persona", today)
    for n in range(2):
        u = user(db, 100 + n)
        db.add(Favorite(user_id=u.id, spot_id=spot.id))
    db.commit()
    r = client.get(f"/spots/{spot.id}/owner-stats", headers=as_user(OWNER))
    assert r.status_code == 200, r.text
    # Hoy, hace 5 y hace 29 entran; hace 30 y 60, no.
    assert r.json() == {"views_30d": 3, "favorites": 2}


def test_las_estadisticas_son_solo_del_duenio(client, make_spot):
    spot = make_spot(name="Lugar")
    assert client.get(f"/spots/{spot.id}/owner-stats", headers=as_user("otro@test.com")).status_code == 403
