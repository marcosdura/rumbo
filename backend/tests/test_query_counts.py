"""Los listados no hacen una consulta por lugar (N+1): la cantidad de
consultas no crece con la cantidad de lugares."""
from sqlalchemy import event

from database import engine
from conftest import OWNER, as_user
from models import Review, SpotChangeRequest, User


def queries(client, url, headers=None):
    n = [0]

    def count(*args, **kwargs):
        n[0] += 1
    event.listen(engine, "before_cursor_execute", count)
    try:
        assert client.get(url, headers=headers or {}).status_code == 200
    finally:
        event.remove(engine, "before_cursor_execute", count)
    return n[0]


def add_spots(db, make_spot, start, end):
    for i in range(start, end):
        spot = make_spot(name=f"Lugar {i}", photos=2, category="Trekking" if i % 2 else "Camping")
        user = User(id=f"u{i}@test.com", email=f"u{i}@test.com")
        db.add(user)
        db.flush()
        db.add(Review(spot_id=spot.id, user_id=user.id, rating=4))
    db.commit()


def test_la_busqueda_y_la_home_no_crecen_con_los_lugares(client, db, make_spot):
    add_spots(db, make_spot, 0, 4)
    few = {url: queries(client, url) for url in ("/spots?limit=24", "/home")}
    add_spots(db, make_spot, 4, 20)
    many = {url: queries(client, url) for url in ("/spots?limit=24", "/home")}

    assert many == few


def add_owned_spots(db, make_spot, start, end):
    """Lugares del dueño, cada uno con un pedido de cambio (pendiente o
    resuelto), para que /profile tenga que buscarlos."""
    for i in range(start, end):
        spot = make_spot(name=f"Mio {i}", photos=1, owner=OWNER)
        status = "pending" if i % 2 else "rejected"
        db.add(SpotChangeRequest(spot_id=spot.id, requested_by=OWNER, status=status, changes={"description": "x"}))
    db.commit()


def test_el_perfil_del_duenio_no_crece_con_sus_lugares(client, db, make_spot):
    urls = ("/spots/mine", "/me/summary", "/me/requests")
    add_owned_spots(db, make_spot, 0, 2)
    few = {url: queries(client, url, as_user(OWNER)) for url in urls}
    add_owned_spots(db, make_spot, 2, 12)
    many = {url: queries(client, url, as_user(OWNER)) for url in urls}

    assert many == few
