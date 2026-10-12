"""El resumen del panel de admin (admin_summary.py)."""
from datetime import date, datetime, timedelta

import admin_summary
from conftest import ADMIN, as_user
from models import (
    Contribution, Favorite, OperatorChangeRequest, Report, Review, SpotChangeRequest, SpotClaim, SpotImage,
    SpotView, User,
)

TODAY = date(2026, 10, 12)


def at(days_ago: int, hour: int = 12) -> datetime:
    return datetime.combine(TODAY - timedelta(days=days_ago), datetime.min.time()) + timedelta(hours=hour)


def user(db, n, days_ago=0):
    u = User(id=f"u{n}", email=f"u{n}@test.com", created_at=at(days_ago))
    db.add(u)
    db.flush()
    return u


def test_solo_el_admin(client):
    assert client.get("/admin/summary", headers=as_user("otro@test.com")).status_code == 403
    r = client.get("/admin/summary", headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    assert set(r.json()) == {"queues", "metrics", "views_by_day", "top_viewed", "top_favorited", "content_health"}


def test_bandeja_cuenta_lo_pendiente_y_desde_cuando_espera(db, make_spot):
    pendiente_viejo = make_spot(name="Viejo", approved=False, created_at=at(10))
    make_spot(name="Nuevo", approved=False, created_at=at(1))
    # Rechazado (espera al dueño) y de cuenta eliminada: no son trabajo del admin.
    make_spot(name="Rechazado", approved=False, rejected_at=at(3))
    make_spot(name="Sin duenio", approved=False, owner_deleted_at=at(3))
    spot = make_spot(name="Publicado")
    db.add_all([
        SpotChangeRequest(spot_id=spot.id, requested_by="d@test.com", changes={}, created_at=at(4)),
        SpotChangeRequest(spot_id=spot.id, requested_by="d@test.com", changes={}, status="approved", created_at=at(9)),
        Contribution(kind="photo", item_id=1, spot_id=spot.id, author_email="a@test.com", title="Foto", created_at=at(2)),
        OperatorChangeRequest(kind="kayak", operator_id=1, spot_id=spot.id, requested_by="k@test.com", changes={}, created_at=at(6)),
        SpotClaim(spot_id=spot.id, user_email="c@test.com", created_at=at(5)),
        # Dos reportes sobre lo mismo son una sola decisión; otro sobre otra cosa, otra.
        Report(target_kind="spot", target_id=spot.id, spot_id=spot.id, reporter_email="r1@test.com", reason="spam", created_at=at(7)),
        Report(target_kind="spot", target_id=spot.id, spot_id=spot.id, reporter_email="r2@test.com", reason="spam", created_at=at(2)),
        Report(target_kind="review", target_id=9, spot_id=spot.id, reporter_email="r1@test.com", reason="offensive", created_at=at(1)),
        Report(target_kind="review", target_id=8, spot_id=spot.id, reporter_email="r1@test.com", reason="offensive", status="dismissed", created_at=at(1)),
    ])
    db.commit()

    q = admin_summary.summary(db, TODAY)["queues"]
    assert q["new_spots"]["count"] == 2
    assert q["new_spots"]["oldest"].startswith(pendiente_viejo.created_at.date().isoformat())
    assert q["changes"]["count"] == 1
    assert q["contributions"]["count"] == 1
    assert q["operator_changes"]["count"] == 1
    assert q["claims"]["count"] == 1
    assert q["reports"]["count"] == 2
    assert q["reports"]["oldest"].startswith(at(7).date().isoformat())


def test_bandeja_vacia(db):
    q = admin_summary.summary(db, TODAY)["queues"]
    assert q["changes"] == {"count": 0, "oldest": None}


def test_metricas_ultimos_30_dias_contra_los_30_anteriores(db, make_spot):
    spot = make_spot(name="Lugar", created_at=at(40))
    make_spot(name="Lugar nuevo", created_at=at(3))
    make_spot(name="Nuevo sin aprobar", approved=False, created_at=at(3))
    # Usuarios: 2 en los últimos 30 días (hoy y hace 29), en los anteriores hace 30 y hace 59.
    users = [user(db, 1, 0), user(db, 2, 29), user(db, 3, 30), user(db, 4, 70)]
    # Hace 59 entra en la anterior; hace 60 ya no.
    user(db, 5, 59)
    user(db, 6, 60)
    for i, u in enumerate(users):
        db.add(Review(spot_id=spot.id, user_id=u.id, rating=5, created_at=at([1, 2, 45, 80][i])))
    db.add(Favorite(user_id=users[0].id, spot_id=spot.id, created_at=at(5)))
    db.add_all([SpotView(spot_id=spot.id, day=TODAY - timedelta(days=d), viewer_hash=f"h{i}") for i, d in enumerate((0, 1, 1, 35))])
    db.commit()

    m = admin_summary.summary(db, TODAY)["metrics"]
    assert m["users"] == {"current": 2, "previous": 2}
    assert m["reviews"] == {"current": 2, "previous": 1}
    assert m["favorites"] == {"current": 1, "previous": 0}
    assert m["views"] == {"current": 3, "previous": 1}
    # Lugares nuevos: los publicados creados en la ventana.
    # Lugares nuevos: los publicados creados en cada ventana ("Lugar", hace 40 días, en la anterior).
    assert m["new_spots"] == {"current": 1, "previous": 1}


def test_visitas_por_dia_con_los_dias_sin_visitas_en_cero(db, make_spot):
    spot = make_spot(name="Lugar")
    db.add_all([SpotView(spot_id=spot.id, day=TODAY, viewer_hash=f"h{i}") for i in range(3)])
    db.add(SpotView(spot_id=spot.id, day=TODAY - timedelta(days=29), viewer_hash="x"))
    db.add(SpotView(spot_id=spot.id, day=TODAY - timedelta(days=30), viewer_hash="y"))
    db.commit()
    days = admin_summary.summary(db, TODAY)["views_by_day"]
    assert len(days) == 30
    assert days[0] == {"day": (TODAY - timedelta(days=29)).isoformat(), "count": 1}
    assert days[-1] == {"day": TODAY.isoformat(), "count": 3}
    assert sum(d["count"] for d in days) == 4


def test_los_mas_vistos_y_los_mas_guardados(db, make_spot):
    a, b = make_spot(name="A"), make_spot(name="B")
    oculto = make_spot(name="Oculto", approved=False)
    for i in range(3):
        db.add(SpotView(spot_id=b.id, day=TODAY - timedelta(days=i), viewer_hash=f"b{i}"))
    db.add(SpotView(spot_id=a.id, day=TODAY, viewer_hash="a"))
    db.add(SpotView(spot_id=a.id, day=TODAY - timedelta(days=40), viewer_hash="viejo"))
    for i in range(5):
        db.add(SpotView(spot_id=oculto.id, day=TODAY, viewer_hash=f"o{i}"))
    u1, u2 = user(db, 1), user(db, 2)
    db.add_all([Favorite(user_id=u1.id, spot_id=a.id), Favorite(user_id=u2.id, spot_id=a.id), Favorite(user_id=u1.id, spot_id=b.id)])
    db.commit()

    s = admin_summary.summary(db, TODAY)
    assert [(t["name"], t["count"]) for t in s["top_viewed"]] == [("B", 3), ("A", 1)]
    assert [(t["name"], t["count"]) for t in s["top_favorited"]] == [("A", 2), ("B", 1)]


def test_salud_del_contenido_de_los_publicados(db, make_spot):
    make_spot(name="Completo", photos=1)
    sin_foto = make_spot(name="Sin foto")
    make_spot(name="Sin descripcion", photos=1, description="   ")
    make_spot(name="Pendiente sin nada", approved=False, description="")
    db.add(Review(spot_id=sin_foto.id, user_id=user(db, 1).id, rating=4))
    db.commit()

    h = admin_summary.summary(db, TODAY)["content_health"]
    assert h["no_photos"]["count"] == 1 and h["no_photos"]["spots"][0]["name"] == "Sin foto"
    assert [s["name"] for s in h["no_description"]["spots"]] == ["Sin descripcion"]
    assert h["no_reviews"]["count"] == 2


def test_salud_muestra_hasta_8_ejemplos_pero_cuenta_todos(db, make_spot):
    for i in range(10):
        make_spot(name=f"Lugar {i:02d}")
    h = admin_summary.summary(db, TODAY)["content_health"]
    assert h["no_photos"]["count"] == 10
    assert len(h["no_photos"]["spots"]) == 8
    assert db.query(SpotImage).count() == 0
