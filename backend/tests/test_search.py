"""Búsqueda (GET /spots): orden y filtros de información práctica, glamping
y motorhome."""
from datetime import datetime, timedelta, timezone

from conftest import OWNER, as_user
from models import CampingDetail, Category, Favorite, GlampingAmenity, GlampingDetail, MotorhomeDetail, Review, SpotCategory, User


def with_category(db, spot):
    db.add(SpotCategory(spot_id=spot.id, category_id=spot.category_id, is_primary=True))
    db.commit()
    return spot


def names(client, **params):
    r = client.get("/spots", params=params)
    assert r.status_code == 200, r.text
    return [s["name"] for s in r.json()]


def user(db, n):
    u = User(id=f"u{n}", email=f"u{n}@test.com")
    db.add(u)
    db.flush()
    return u


# -------- Orden --------

def test_por_nombre(client, db, make_spot):
    # Sin importar mayúsculas: "arroyo" va antes que "Bosque".
    for name in ["Cascada", "arroyo", "Bosque"]:
        with_category(db, make_spot(name=name))
    assert names(client, activity="Camping", sort="name") == ["arroyo", "Bosque", "Cascada"]


def test_mejor_calificados_y_los_sin_resenias_al_final(client, db, make_spot):
    a, b, c = (with_category(db, make_spot(name=n)) for n in ["A", "B", "C"])
    u1, u2 = user(db, 1), user(db, 2)
    db.add_all([
        Review(spot_id=a.id, user_id=u1.id, rating=3),
        Review(spot_id=b.id, user_id=u1.id, rating=5), Review(spot_id=b.id, user_id=u2.id, rating=4),
    ])
    db.commit()
    assert names(client, activity="Camping", sort="rating") == ["B", "A", "C"]


def test_recomendados_por_la_puntuacion_de_populares(client, db, make_spot):
    a, b = with_category(db, make_spot(name="A")), with_category(db, make_spot(name="B"))
    now = datetime.now(timezone.utc)
    for i in range(3):
        db.add(Favorite(user_id=user(db, i).id, spot_id=b.id, created_at=now - timedelta(days=1)))
    db.commit()
    assert names(client, activity="Camping", sort="recommended")[0] == "B"
    assert a.id


def test_ordenar_no_rompe_la_paginacion_ni_el_total(client, db, make_spot):
    for i in range(5):
        with_category(db, make_spot(name=f"L{i}"))
    r = client.get("/spots", params={"activity": "Camping", "sort": "name", "limit": 2, "offset": 2})
    assert [s["name"] for s in r.json()] == ["L2", "L3"]
    assert r.headers["X-Total-Count"] == "5"


# -------- Información práctica (cualquier actividad) --------

def test_filtros_de_reserva_y_senial(client, db, make_spot):
    with_category(db, make_spot(name="Sin reserva con señal", reservation_required=False, cell_signal=True))
    with_category(db, make_spot(name="Con reserva", reservation_required=True, cell_signal=True))
    with_category(db, make_spot(name="No se"))
    assert names(client, reservation_required="false") == ["Sin reserva con señal"]
    assert sorted(names(client, cell_signal="true")) == ["Con reserva", "Sin reserva con señal"]


# -------- Glamping y motorhome --------

def test_glamping_por_precio_del_mas_barato_y_servicios(client, db, make_spot):
    barato = with_category(db, make_spot(name="Barato", category="Glamping"))
    caro = with_category(db, make_spot(name="Caro", category="Glamping"))
    db.add_all([
        GlampingDetail(spot_id=barato.id, price_per_night=2500, is_approved=True),
        GlampingDetail(spot_id=barato.id, price_per_night=9000, is_approved=True),
        GlampingDetail(spot_id=caro.id, price_per_night=7000, is_approved=True),
        GlampingAmenity(spot_id=caro.id, wifi=True),
    ])
    db.commit()
    assert names(client, activity="Glamping", glamping_price="bajo") == ["Barato"]
    assert names(client, activity="Glamping", glamping_price="alto") == ["Caro"]
    assert names(client, activity="Glamping", glamping_amenity="wifi") == ["Caro"]


def test_motorhome_por_servicios(client, db, make_spot):
    completo = with_category(db, make_spot(name="Completo", category="Motorhome"))
    solo_agua = with_category(db, make_spot(name="Solo agua", category="Motorhome"))
    db.add_all([
        MotorhomeDetail(spot_id=completo.id, has_water=True, has_electricity=True, has_dump_station=True),
        MotorhomeDetail(spot_id=solo_agua.id, has_water=True, has_electricity=False),
    ])
    db.commit()
    assert sorted(names(client, activity="Motorhome", motorhome_service="water")) == ["Completo", "Solo agua"]
    assert names(client, activity="Motorhome", motorhome_service=["water", "electricity"]) == ["Completo"]


# -------- Precio del camping --------

def test_camping_filtra_por_el_precio_del_lugar(client, db, make_spot):
    # El dueño editó el precio (spots.price); el del detalle quedó viejo.
    editado = with_category(db, make_spot(name="Editado", category="Camping", price=1000))
    gratis = with_category(db, make_spot(name="Gratis", category="Camping", price=0))
    db.add_all([CampingDetail(spot_id=editado.id, price=200), CampingDetail(spot_id=gratis.id, price=500)])
    db.commit()
    assert names(client, activity="Camping", price_range="alto") == ["Editado"]
    assert names(client, activity="Camping", price_range="bajo") == []
    assert names(client, activity="Camping", price_range="gratis") == ["Gratis"]


def test_sumar_camping_a_un_lugar_sin_precio_le_pone_el_precio(client, db, make_spot):
    sin_precio = make_spot(name="Sin precio", category="Trekking", approved=False)
    con_precio = make_spot(name="Con precio", category="Trekking", approved=False, price=700)
    db.add(Category(name="Camping"))
    db.commit()
    for spot in (sin_precio, con_precio):
        r = client.post(f"/spots/{spot.id}/categories", json={"category": "Camping", "camping_detail": {"price": 450}}, headers=as_user(OWNER))
        assert r.status_code == 200, r.text
    db.expire_all()
    assert (sin_precio.price, con_precio.price) == (450, 700)
