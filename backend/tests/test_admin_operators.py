"""GET /admin/operators: escuelas de surf y servicios de kayak en el panel."""
from conftest import ADMIN, as_user
from models import KayakDetail, KayakReview, SurfReview, SurfSchool, User


def test_solo_el_admin(client):
    assert client.get("/admin/operators", headers=as_user("otro@test.com")).status_code == 403


def test_lista_publicados_y_en_revision_con_sus_datos(client, db, make_spot):
    playa = make_spot(name="Playa Brava", department="Maldonado")
    db.add_all([
        SurfSchool(spot_id=playa.id, name="Ola", owner_email="ola@test.com", description="Clases", photo_1="a", photo_2="b"),
        KayakDetail(spot_id=playa.id, name="Kayak Sur", is_approved=False),
    ])
    db.commit()
    school = db.query(SurfSchool).first()
    for i, rating in enumerate((5, 4)):
        db.add(User(id=f"u{i}", email=f"u{i}@test.com"))
        db.flush()
        db.add(SurfReview(surf_beach_id=school.id, user_id=f"u{i}", rating=rating))
    db.commit()

    r = client.get("/admin/operators", headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    kayak, ola = r.json()  # por nombre
    assert ola == {
        "kind": "surf_school", "id": school.id, "name": "Ola",
        "spot": {"id": playa.id, "name": "Playa Brava", "department": "Maldonado"},
        "owner_email": "ola@test.com", "is_approved": True, "photos": 2, "has_description": True,
        "review_count": 2, "average_rating": 4.5,
    }
    # El de kayak está en revisión (el filtro global lo ocultaría): igual aparece.
    assert kayak["kind"] == "kayak" and kayak["is_approved"] is False
    assert (kayak["photos"], kayak["has_description"], kayak["review_count"], kayak["average_rating"]) == (0, False, 0, None)


def test_las_resenias_de_kayak_no_se_mezclan_con_las_de_surf(client, db, make_spot):
    playa = make_spot(name="Laguna")
    db.add_all([SurfSchool(spot_id=playa.id, name="Escuela"), KayakDetail(spot_id=playa.id, name="Kayak")])
    db.add(User(id="u", email="u@test.com"))
    db.commit()
    kayak = db.query(KayakDetail).first()
    db.add(KayakReview(kayak_details_id=kayak.id, user_id="u", rating=3))
    db.commit()
    by_name = {o["name"]: o for o in client.get("/admin/operators", headers=as_user(ADMIN)).json()}
    assert by_name["Kayak"]["review_count"] == 1
    assert by_name["Escuela"]["review_count"] == 0
