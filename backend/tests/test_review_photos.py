"""La foto de una reseña (item_photos, target "review"): una por reseña, la
sube su autor y pasa por revisión; la reseña se publica al instante."""
import os
import tempfile
from datetime import datetime, timezone

from alembic import command
from sqlalchemy import create_engine, text

from conftest import ADMIN, DB_URL, OTHER, OWNER, alembic_config, as_user, every
from models import Contribution, ItemPhoto, SpotDB, User

AUTHOR = "ana@test.com"


def setup(client, db, make_spot):
    spot = make_spot(owner=OWNER)
    db.add(User(id=AUTHOR, email=AUTHOR))
    db.commit()
    review = client.post(f"/reviews/{spot.id}", json={"rating": 5, "comment": "Hermoso"}, headers=as_user(AUTHOR)).json()
    return spot, review


def pid(spot, n=1):
    return f"rumbo/spots/{spot.id}/{n:016x}"


def add_photo(client, spot, review, user=AUTHOR, n=1):
    return client.post("/photos", json={"target": "review", "target_id": review["id"], "public_ids": [pid(spot, n)]}, headers=as_user(user))


def listed(client, spot, user=None):
    return client.get(f"/reviews/{spot.id}", headers=as_user(user) if user else {}).json()[0]["photo"]


def approve_all(client):
    for c in client.get("/admin/contributions", headers=as_user(ADMIN)).json():
        assert client.post(f"/admin/contributions/{c['id']}/approve", headers=as_user(ADMIN)).status_code == 200


def test_quien_resena_puede_pedir_la_firma_y_otro_no(client, db, make_spot):
    spot, _ = setup(client, db, make_spot)
    can = lambda user: client.get(f"/spots/{spot.id}/can-upload", params={"public_id": f"{spot.id}/{9:016x}"}, headers=as_user(user)).status_code
    assert can(AUTHOR) == 200
    assert can(OTHER) == 403


def test_la_foto_queda_en_revision_y_solo_el_autor_la_ve_hasta_aprobarla(client, db, make_spot):
    spot, review = setup(client, db, make_spot)
    r = add_photo(client, spot, review)
    assert r.status_code == 200 and r.json()["pending"] is True
    assert listed(client, spot) is None
    assert listed(client, spot, AUTHOR) == {"id": r.json()["photos"][0]["id"], "cloudinary_public_id": pid(spot), "pending": True}
    summary = client.get(f"/reviews/{spot.id}/summary", headers=as_user(AUTHOR)).json()
    assert summary["my_review"]["photo"]["pending"] is True

    approve_all(client)
    assert listed(client, spot) == {"id": r.json()["photos"][0]["id"], "cloudinary_public_id": pid(spot), "pending": False}


def test_una_sola_foto_por_resena_y_solo_de_su_autor(client, db, make_spot):
    spot, review = setup(client, db, make_spot)
    assert add_photo(client, spot, review, user=OTHER).status_code == 404
    assert add_photo(client, spot, review).status_code == 200
    second = add_photo(client, spot, review, n=2)
    assert second.status_code == 409 and "Ya tiene su foto" in second.json()["detail"]


def test_el_dueno_del_lugar_no_saca_la_foto_de_una_resena_y_el_autor_si(client, db, make_spot, destroyed):
    spot, review = setup(client, db, make_spot)
    photo_id = add_photo(client, spot, review).json()["photos"][0]["id"]
    assert client.delete(f"/photos/{photo_id}", headers=as_user(OWNER)).status_code == 403
    assert client.delete(f"/photos/{photo_id}", headers=as_user(AUTHOR)).status_code == 200
    assert destroyed == [pid(spot)]
    assert every(db, Contribution).one().status == "withdrawn"


def test_borrar_la_resena_borra_su_foto_tambien_de_cloudinary(client, db, make_spot, destroyed):
    spot, review = setup(client, db, make_spot)
    add_photo(client, spot, review)
    assert client.delete(f"/reviews/{review['id']}", headers=as_user(AUTHOR)).status_code == 200
    assert destroyed == [pid(spot)]
    assert every(db, ItemPhoto).count() == 0


def test_si_el_admin_borra_la_resena_tambien_se_va_la_foto(client, db, make_spot, destroyed):
    spot, review = setup(client, db, make_spot)
    add_photo(client, spot, review)
    approve_all(client)
    assert client.delete(f"/admin/reviews/review/{review['id']}", headers=as_user(ADMIN)).status_code == 200
    assert destroyed == [pid(spot)]


def test_borrar_la_cuenta_borra_las_fotos_de_sus_resenas(client, db, make_spot, destroyed):
    spot, review = setup(client, db, make_spot)
    add_photo(client, spot, review)
    approve_all(client)
    assert client.delete("/users/me", headers=as_user(AUTHOR)).status_code == 200
    assert destroyed == [pid(spot)]
    assert every(db, ItemPhoto).count() == 0


def test_aprobar_la_foto_de_una_resena_no_cambia_la_ultima_actualizacion_del_lugar(client, db, make_spot):
    spot, review = setup(client, db, make_spot)
    add_photo(client, spot, review)
    old = datetime(2026, 1, 1, tzinfo=timezone.utc)
    db.query(SpotDB).filter(SpotDB.id == spot.id).update({SpotDB.info_updated_at: old})
    db.commit()
    approve_all(client)
    db.expire_all()
    assert db.get(SpotDB, spot.id).info_updated_at.replace(tzinfo=timezone.utc) == old


def test_migracion_0025_suma_las_resenas_sin_tocar_las_fotos_que_ya_estan():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0024")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Trekking')"))
            c.execute(text("INSERT INTO spots (id, name, description, department, category_id, is_approved, suggested_by_visitor) VALUES (1, 'X', 'x', 'Rocha', 1, 1, 0)"))
            c.execute(text("INSERT INTO routes (id, spot_id, name, slug, is_approved) VALUES (1, 1, 'R', 'r', 1)"))
            c.execute(text("INSERT INTO item_photos (id, spot_id, trekking_route_id, cloudinary_public_id, is_approved) VALUES (1, 1, 1, 'rumbo/spots/1/a', 1)"))
        command.upgrade(alembic_config(url), "head")
        with engine.begin() as c:
            assert c.execute(text("SELECT trekking_route_id, review_id FROM item_photos")).one() == (1, None)
            c.execute(text("INSERT INTO users (id, email) VALUES ('u', 'u')"))
            c.execute(text("INSERT INTO reviews (id, spot_id, user_id, rating) VALUES (1, 1, 'u', 5)"))
            c.execute(text("INSERT INTO item_photos (spot_id, review_id, cloudinary_public_id, is_approved) VALUES (1, 1, 'rumbo/spots/1/b', 0)"))
        # Dos destinos a la vez sigue sin poder ser.
        try:
            with engine.begin() as c:
                c.execute(text("INSERT INTO item_photos (spot_id, trekking_route_id, review_id, cloudinary_public_id, is_approved) VALUES (1, 1, 1, 'rumbo/spots/1/c', 0)"))
            raise AssertionError("tenía que rechazarla")
        except Exception as e:
            assert "CHECK" in str(e) or "item_photos_one_target" in str(e)
        command.downgrade(alembic_config(url), "0024")
        with engine.connect() as c:
            assert c.execute(text("SELECT count(*) FROM item_photos")).scalar() == 1
        engine.dispose()
    finally:
        os.environ["DATABASE_URL"] = DB_URL
