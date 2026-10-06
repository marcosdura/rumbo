"""Reportes: reportar spots, reseñas y escuelas; la cola del admin y sus
acciones (reports.py)."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import Report, Review, SpotDB, SurfReview, SurfSchool

REPORTER = "reporta@test.com"


def report(client, kind, target_id, reason="false_info", comment=None, user=REPORTER):
    body = {"target_kind": kind, "target_id": target_id, "reason": reason}
    if comment is not None:
        body["comment"] = comment
    return client.post("/reports", json=body, headers=as_user(user))


def resolve(client, kind, target_id, action, reason=None, user=ADMIN):
    body = {"target_kind": kind, "target_id": target_id, "action": action}
    if reason is not None:
        body["reason"] = reason
    return client.post("/admin/reports/resolve", json=body, headers=as_user(user))


def queue(client):
    return client.get("/admin/reports", headers=as_user(ADMIN)).json()


@pytest.fixture
def review(db, make_spot, make_user):
    spot = make_spot()
    author = make_user(OTHER)
    r = Review(spot_id=spot.id, user_id=author.id, rating=1, comment="Texto ofensivo")
    db.add(r)
    db.commit()
    return r


# -------- Reportar --------

def test_reportar_un_spot(client, db, make_spot):
    spot = make_spot()
    assert report(client, "spot", spot.id).status_code == 201
    r = db.query(Report).one()
    assert (r.target_kind, r.spot_id, r.reporter_email, r.status) == ("spot", spot.id, REPORTER, "open")


def test_hace_falta_sesion(client, make_spot):
    spot = make_spot()
    r = client.post("/reports", json={"target_kind": "spot", "target_id": spot.id, "reason": "spam"})
    assert r.status_code == 401


def test_un_reporte_abierto_por_persona(client, make_spot):
    spot = make_spot()
    report(client, "spot", spot.id)
    assert report(client, "spot", spot.id, "spam").status_code == 409
    assert report(client, "spot", spot.id, user="otra@test.com").status_code == 201


def test_no_se_reporta_lo_propio(client, make_spot):
    spot = make_spot()
    assert report(client, "spot", spot.id, user=OWNER).status_code == 400


def test_otro_exige_comentario(client, make_spot):
    spot = make_spot()
    assert report(client, "spot", spot.id, "other").status_code == 422
    assert report(client, "spot", spot.id, "other", "  ").status_code == 422
    assert report(client, "spot", spot.id, "other", "Cobran entrada").status_code == 201


@pytest.mark.parametrize("kind,reason", [("hotel", "spam"), ("spot", "me cae mal")])
def test_tipo_o_motivo_desconocido(client, make_spot, kind, reason):
    spot = make_spot()
    assert report(client, kind, spot.id, reason).status_code == 422


def test_solo_se_reporta_lo_publicado(client, make_spot):
    pending = make_spot(name="Pendiente", approved=False)
    assert report(client, "spot", pending.id).status_code == 404
    assert report(client, "spot", 999).status_code == 404


def test_reportar_una_resenia(client, review):
    assert report(client, "review", review.id, "offensive").status_code == 201


def test_el_autor_no_reporta_su_resenia(client, review):
    assert report(client, "review", review.id, user=OTHER).status_code == 400


def test_reportar_una_escuela_y_su_resenia(client, db, make_spot, make_user):
    beach = make_spot(name="Playa", category="Surf")
    school = SurfSchool(spot_id=beach.id, name="Ola", owner_email="op@test.com")
    db.add(school)
    db.flush()
    author = make_user(OTHER)
    sr = SurfReview(surf_beach_id=school.id, user_id=author.id, rating=5, comment="spam")
    db.add(sr)
    db.commit()
    assert report(client, "surf_school", school.id, "closed").status_code == 201
    assert report(client, "surf_review", sr.id, "spam").status_code == 201
    assert {r.spot_id for r in db.query(Report)} == {beach.id}


def test_la_motivos_que_se_ofrecen(client):
    values = [r["value"] for r in client.get("/reports/reasons").json()]
    assert values == ["false_info", "offensive", "spam", "wrong_photos", "closed", "other"]


# -------- Cola del admin --------

def test_la_cola_agrupa_por_cosa_reportada(client, make_spot, review):
    spot = make_spot(name="Otro lugar")
    report(client, "review", review.id, "offensive")
    report(client, "review", review.id, "spam", user="b@test.com")
    report(client, "spot", spot.id)
    groups = queue(client)
    assert [(g["target_kind"], g["count"]) for g in groups] == [("review", 2), ("spot", 1)]
    first = groups[0]
    assert first["reasons"] == {"offensive": 1, "spam": 1}
    assert first["target"]["comment"] == "Texto ofensivo"
    assert first["actions"] == ["delete", "dismiss"]


def test_la_cola_solo_para_admin(client):
    assert client.get("/admin/reports", headers=as_user(REPORTER)).status_code == 403


def test_descartar_cierra_todos_los_reportes(client, db, make_spot):
    spot = make_spot()
    report(client, "spot", spot.id)
    report(client, "spot", spot.id, user="b@test.com")
    assert resolve(client, "spot", spot.id, "dismiss").status_code == 200
    assert {r.status for r in db.query(Report)} == {"dismissed"}
    assert queue(client) == []
    db.expire_all()
    assert db.get(SpotDB, spot.id).is_approved is True, "descartar no toca el spot"


def test_despublicar_un_spot_con_motivo(client, db, make_spot):
    spot = make_spot()
    report(client, "spot", spot.id, "closed")
    assert resolve(client, "spot", spot.id, "unpublish").status_code == 422, "el motivo es obligatorio"
    assert resolve(client, "spot", spot.id, "unpublish", "Nos confirmaron que cerró").status_code == 200
    db.expire_all()
    s = db.get(SpotDB, spot.id)
    assert (s.is_approved, s.rejection_reason) == (False, "Nos confirmaron que cerró")
    assert db.query(Report).one().resolution == "unpublished"


def test_borrar_una_resenia_reportada(client, db, review):
    report(client, "review", review.id, "offensive")
    assert resolve(client, "review", review.id, "delete").status_code == 200
    assert db.query(Review).count() == 0
    assert db.query(Report).one().resolution == "deleted"


def test_borrar_una_escuela_reportada_borra_sus_fotos(client, db, make_spot, destroyed):
    beach = make_spot(name="Playa", category="Surf")
    url = f"https://res.cloudinary.com/demo/image/upload/v1/rumbo/spots/{beach.id}/{1:016x}.jpg"
    school = SurfSchool(spot_id=beach.id, name="Ola", owner_email="op@test.com", photo_1=url)
    db.add(school)
    db.commit()
    report(client, "surf_school", school.id, "closed")
    assert resolve(client, "surf_school", school.id, "delete").status_code == 200
    assert every(db, SurfSchool).count() == 0
    assert destroyed == [f"rumbo/spots/{beach.id}/{1:016x}"]


def test_accion_que_no_aplica(client, make_spot):
    spot = make_spot()
    report(client, "spot", spot.id)
    # Un spot no se borra desde un reporte (eso es Eliminar, para el spam).
    assert resolve(client, "spot", spot.id, "delete").status_code == 422


def test_resolver_sin_reportes_abiertos(client, make_spot):
    spot = make_spot()
    assert resolve(client, "spot", spot.id, "dismiss").status_code == 404


def test_si_lo_reportado_ya_no_existe_se_cierra_igual(client, db, review):
    report(client, "review", review.id, "offensive")
    db.delete(db.get(Review, review.id))
    db.commit()
    assert queue(client)[0]["target"] == {"exists": False}
    assert resolve(client, "review", review.id, "delete").status_code == 200
    assert db.query(Report).one().status == "dismissed"


def test_solo_el_admin_resuelve(client, make_spot):
    spot = make_spot()
    report(client, "spot", spot.id)
    assert resolve(client, "spot", spot.id, "dismiss", user=REPORTER).status_code == 403


# -------- El admin borra cualquier reseña --------

def test_el_admin_borra_una_resenia_ajena(client, db, review):
    report(client, "review", review.id, "offensive")
    assert client.delete(f"/admin/reviews/review/{review.id}", headers=as_user(ADMIN)).status_code == 200
    assert db.query(Review).count() == 0
    assert db.query(Report).one().status == "actioned"


def test_solo_el_admin(client, review):
    assert client.delete(f"/admin/reviews/review/{review.id}", headers=as_user(OWNER)).status_code == 403
    assert client.delete("/admin/reviews/hotel/1", headers=as_user(ADMIN)).status_code == 404
