"""GET /sitemap/places: cuántos lugares publicados hay por actividad y
departamento (las páginas /lugares/...)."""
from datetime import datetime

from models import Category, SpotCategory


def with_categories(db, spot, *names):
    for i, name in enumerate(names):
        cat = db.query(Category).filter_by(name=name).first() or Category(name=name)
        db.add(cat)
        db.flush()
        db.add(SpotCategory(spot_id=spot.id, category_id=cat.id, is_primary=i == 0))
    db.commit()


def test_cuenta_por_actividad_y_departamento_solo_lo_publicado(client, db, make_spot):
    # Un lugar con dos actividades cuenta en las dos.
    with_categories(db, make_spot(name="A", department="Rocha", category="Camping"), "Camping", "Trekking")
    with_categories(db, make_spot(name="B", department="Rocha", category="Camping"), "Camping")
    with_categories(db, make_spot(name="C", department="Lavalleja", category="Trekking"), "Trekking")
    # No cuentan: en revisión, de una cuenta borrada, sin departamento.
    with_categories(db, make_spot(name="D", department="Rocha", approved=False), "Camping")
    with_categories(db, make_spot(name="E", department="Rocha", owner_deleted_at=datetime(2026, 1, 1)), "Camping")
    with_categories(db, make_spot(name="F", department=None), "Camping")

    r = client.get("/sitemap/places")
    assert r.status_code == 200
    assert r.json() == [
        {"activity": "Camping", "department": "Rocha", "count": 2},
        {"activity": "Trekking", "department": "Lavalleja", "count": 1},
        {"activity": "Trekking", "department": "Rocha", "count": 1},
    ]
