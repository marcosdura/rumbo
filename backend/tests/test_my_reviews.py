"""Mis reseñas: las de lugares, escuelas de surf y servicios de kayak."""
from datetime import datetime, timedelta

from conftest import OTHER, as_user
from models import KayakDetail, KayakReview, Review, SurfReview, SurfSchool, User


def test_las_tres_juntas_de_la_mas_nueva_a_la_mas_vieja(client, db, make_spot):
    # En los tests, el "sub" del usuario es su email (conftest).
    me = User(id=OTHER, email=OTHER)
    db.add(me)
    db.flush()
    lugar = make_spot(name="Cerro", slug="cerro")
    playa = make_spot(name="Playa Brava", category="Surf")
    school = SurfSchool(spot_id=playa.id, name="Escuela Ola")
    kayak = KayakDetail(spot_id=playa.id, name="Kayak Sur")
    db.add_all([school, kayak])
    db.flush()
    now = datetime(2026, 10, 1)
    db.add_all([
        Review(user_id=me.id, spot_id=lugar.id, rating=5, comment="Hermoso", created_at=now - timedelta(days=3)),
        SurfReview(user_id=me.id, surf_beach_id=school.id, rating=4, created_at=now - timedelta(days=1)),
        KayakReview(user_id=me.id, kayak_details_id=kayak.id, rating=3, created_at=now - timedelta(days=2)),
    ])
    db.commit()
    r = client.get("/reviews/user/me", headers=as_user(OTHER))
    assert r.status_code == 200, r.text
    rows = r.json()
    assert [(x["kind"], x["target_name"]) for x in rows] == [("surf", "Escuela Ola"), ("kayak", "Kayak Sur"), ("spot", "Cerro")]
    assert rows[0]["href"] == f"/surf/escuela-ola-{school.id}#reviews"
    assert rows[1]["href"] == f"/kayak/kayak-sur-{kayak.id}#reviews"
    assert rows[2]["href"] == "/spots/cerro#reviews"
    assert client.get("/me/summary", headers=as_user(OTHER)).json()["reviews"] == 3
