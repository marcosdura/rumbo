"""Mis reseñas: las de lugares (también escuelas de surf y servicios de
kayak, que son lugares), de la más nueva a la más vieja."""
from datetime import datetime, timedelta

from conftest import OTHER, as_user
from models import Review, SurfDetail, User


def test_de_la_mas_nueva_a_la_mas_vieja_con_link_al_lugar(client, db, make_spot):
    # En los tests, el "sub" del usuario es su email (conftest).
    me = User(id=OTHER, email=OTHER)
    db.add(me)
    db.flush()
    lugar = make_spot(name="Cerro", slug="cerro")
    escuela = make_spot(name="Escuela Ola", slug="escuela-ola", category="Surf")
    db.add(SurfDetail(spot_id=escuela.id))
    now = datetime(2026, 10, 1)
    db.add_all([
        Review(user_id=me.id, spot_id=lugar.id, rating=5, comment="Hermoso", created_at=now - timedelta(days=3)),
        Review(user_id=me.id, spot_id=escuela.id, rating=4, created_at=now - timedelta(days=1)),
        Review(user_id="otro", spot_id=lugar.id, rating=1, created_at=now),
    ])
    db.commit()
    r = client.get("/reviews/user/me", headers=as_user(OTHER))
    assert r.status_code == 200, r.text
    rows = r.json()
    assert [(x["kind"], x["target_name"], x["href"]) for x in rows] == [
        ("spot", "Escuela Ola", "/spots/escuela-ola#reviews"),
        ("spot", "Cerro", "/spots/cerro#reviews"),
    ]
    assert client.get("/me/summary", headers=as_user(OTHER)).json()["reviews"] == 2
