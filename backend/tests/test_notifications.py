"""Notificaciones dentro de la app: los endpoints y qué evento avisa a quién
(notifications.py)."""
from conftest import ADMIN, OTHER, OWNER, as_user
from models import Category, Notification, Review, SurfSchool

THIRD = "tercero@test.com"


def inbox(db, email):
    """(kind, title) de las notificaciones de `email`, en orden."""
    db.expire_all()
    return [(n.kind, n.title) for n in db.query(Notification).filter_by(user_email=email).order_by(Notification.id)]


def kinds(db, email):
    return [k for k, _ in inbox(db, email)]


# -------- Endpoints --------

def test_listar_contar_y_marcar_leidas(client, db):
    for i in range(3):
        db.add(Notification(user_email=OWNER, kind="x", title=f"Aviso {i}"))
    db.add(Notification(user_email=OTHER, kind="x", title="De otro"))
    db.commit()
    body = client.get("/notifications/", headers=as_user(OWNER)).json()
    assert body["unread"] == 3
    assert [n["title"] for n in body["items"]] == ["Aviso 2", "Aviso 1", "Aviso 0"], "lo más nuevo primero"

    first_id = body["items"][0]["id"]
    assert client.post(f"/notifications/{first_id}/read", headers=as_user(OWNER)).status_code == 200
    assert client.get("/notifications/unread-count", headers=as_user(OWNER)).json() == {"unread": 2}

    client.post("/notifications/read-all", headers=as_user(OWNER))
    assert client.get("/notifications/unread-count", headers=as_user(OWNER)).json() == {"unread": 0}
    assert client.get("/notifications/unread-count", headers=as_user(OTHER)).json() == {"unread": 1}, "no toca las de otro"


def test_no_se_marca_la_de_otro(client, db):
    n = Notification(user_email=OTHER, kind="x", title="De otro")
    db.add(n)
    db.commit()
    assert client.post(f"/notifications/{n.id}/read", headers=as_user(OWNER)).status_code == 404


def test_hace_falta_sesion(client):
    assert client.get("/notifications/unread-count").status_code == 401


# -------- Spots --------

def test_un_lugar_nuevo_avisa_al_admin(client, db):
    cat = Category(name="Camping")
    db.add(cat)
    db.commit()
    client.post("/spots", json={"name": "Nuevo", "description": "d", "department": "Rocha", "category_id": cat.id}, headers=as_user(OWNER))
    assert kinds(db, ADMIN) == ["admin_new_spot"]


def test_aprobar_avisa_al_duenio(client, db, make_spot):
    spot = make_spot(approved=False)
    client.patch(f"/admin/spots/{spot.id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    assert inbox(db, OWNER) == [("spot_approved", "Tu lugar «Cascada Escondida» fue aprobado")]


def test_aprobar_una_playa_avisa_a_quien_la_sugirio(client, db, make_spot):
    beach = make_spot(name="Playa", category="Surf", approved=False)
    client.patch(f"/admin/spots/{beach.id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    assert kinds(db, OWNER) == ["spot_approved"]


def test_rechazar_y_despublicar_avisan_con_el_motivo(client, db, make_spot):
    pending = make_spot(name="Pendiente", approved=False)
    published = make_spot(name="Publicado")
    client.post(f"/admin/spots/{pending.id}/reject", json={"reason": "Faltan fotos"}, headers=as_user(ADMIN))
    client.post(f"/admin/spots/{published.id}/reject", json={"reason": "Cerró"}, headers=as_user(ADMIN))
    assert inbox(db, OWNER) == [
        ("spot_rejected", "Tu lugar «Pendiente» no fue aprobado"),
        ("spot_rejected", "Tu lugar «Publicado» fue despublicado"),
    ]
    body = db.query(Notification).filter_by(user_email=OWNER).first().body
    assert "Faltan fotos" in body


def test_reenviar_avisa_al_admin(client, db, make_spot):
    spot = make_spot(approved=False)
    client.post(f"/admin/spots/{spot.id}/reject", json={"reason": "x"}, headers=as_user(ADMIN))
    client.post(f"/spots/{spot.id}/resubmit", headers=as_user(OWNER))
    assert kinds(db, ADMIN) == ["admin_spot_resubmitted"]


# -------- Pedidos de cambio --------

def test_pedido_de_cambio_avisa_al_admin_y_su_resultado_al_duenio(client, db, make_spot):
    spot = make_spot()
    req = client.patch(f"/admin/spots/{spot.id}", json={"name": "Nuevo"}, headers=as_user(OWNER)).json()["change_request"]
    assert kinds(db, ADMIN) == ["admin_change_request"]
    client.post(f"/admin/change-requests/{req['id']}/reject", json={"reason": "No"}, headers=as_user(ADMIN))
    assert kinds(db, OWNER) == ["change_rejected"]


def test_cambio_aprobado(client, db, make_spot):
    spot = make_spot()
    req = client.patch(f"/admin/spots/{spot.id}", json={"name": "Nuevo"}, headers=as_user(OWNER)).json()["change_request"]
    client.post(f"/admin/change-requests/{req['id']}/approve", headers=as_user(ADMIN))
    assert kinds(db, OWNER) == ["change_approved"]


def test_lo_instantaneo_no_avisa_a_nadie(client, db, make_spot):
    spot = make_spot()
    client.patch(f"/admin/spots/{spot.id}", json={"whatsapp": "099"}, headers=as_user(OWNER))
    assert inbox(db, ADMIN) == []


# -------- Aportes --------

def test_aporte_de_otro_aprobado_avisa_al_autor_y_al_duenio(client, db, make_spot):
    spot = make_spot()
    client.post("/sectors/", json={"spot_id": spot.id, "name": "Sector Norte"}, headers=as_user(OTHER))
    assert kinds(db, ADMIN) == ["admin_contribution"]
    contribution_id = client.get("/admin/contributions", headers=as_user(ADMIN)).json()[0]["id"]
    client.post(f"/admin/contributions/{contribution_id}/approve", headers=as_user(ADMIN))
    assert inbox(db, OTHER) == [("contribution_approved", "Se publicó tu aporte «Sector Norte»")]
    assert inbox(db, OWNER) == [("spot_new_content", "Se sumó «Sector Norte» a tu lugar «Cascada Escondida»")]


def test_aporte_propio_aprobado_no_avisa_dos_veces(client, db, make_spot):
    spot = make_spot()
    client.post("/routes/", json={"spot_id": spot.id, "name": "Sendero"}, headers=as_user(OWNER))
    contribution_id = client.get("/admin/contributions", headers=as_user(ADMIN)).json()[0]["id"]
    client.post(f"/admin/contributions/{contribution_id}/approve", headers=as_user(ADMIN))
    assert kinds(db, OWNER) == ["contribution_approved"]


def test_aporte_rechazado(client, db, make_spot):
    spot = make_spot()
    client.post("/sectors/", json={"spot_id": spot.id, "name": "Sector"}, headers=as_user(OTHER))
    contribution_id = client.get("/admin/contributions", headers=as_user(ADMIN)).json()[0]["id"]
    client.post(f"/admin/contributions/{contribution_id}/reject", json={"reason": "Duplicado"}, headers=as_user(ADMIN))
    assert kinds(db, OTHER) == ["contribution_rejected"]


def test_retirar_un_aporte_no_avisa(client, db, make_spot):
    spot = make_spot()
    client.post("/sectors/", json={"spot_id": spot.id, "name": "Sector"}, headers=as_user(OTHER))
    contribution_id = client.get("/admin/contributions", headers=as_user(ADMIN)).json()[0]["id"]
    client.post(f"/contributions/{contribution_id}/withdraw", headers=as_user(OTHER))
    assert inbox(db, OTHER) == []


# -------- Escuelas --------

def test_cambio_de_escuela(client, db, make_spot):
    beach = make_spot(name="Playa", category="Surf")
    school = SurfSchool(spot_id=beach.id, name="Ola", owner_email=THIRD)
    db.add(school)
    db.commit()
    client.patch(f"/operators/surf_school/{school.id}", json={"name": "Ola Nueva"}, headers=as_user(THIRD))
    assert kinds(db, ADMIN) == ["admin_operator_change"]
    change_id = client.get("/admin/operator-change-requests", headers=as_user(ADMIN)).json()[0]["id"]
    client.post(f"/admin/operator-change-requests/{change_id}/approve", headers=as_user(ADMIN))
    assert inbox(db, THIRD) == [("change_approved", "Se aprobó tu cambio en «Ola Nueva»")]


# -------- Reseñas --------

def test_resenia_nueva_avisa_al_duenio(client, db, make_spot, make_user):
    spot = make_spot()
    make_user(OTHER)
    client.post(f"/reviews/{spot.id}", json={"rating": 4, "comment": "Muy lindo"}, headers=as_user(OTHER))
    [(kind, title)] = inbox(db, OWNER)
    assert (kind, title) == ("new_review", "Nueva reseña en «Cascada Escondida»")
    assert db.query(Notification).filter_by(user_email=OWNER).one().body == "★★★★ · Muy lindo"


def test_el_duenio_que_resenia_lo_suyo_no_se_avisa(client, db, make_spot, make_user):
    spot = make_spot()
    make_user(OWNER)
    client.post(f"/reviews/{spot.id}", json={"rating": 5}, headers=as_user(OWNER))
    assert inbox(db, OWNER) == []


def test_resenia_de_escuela_avisa_al_duenio_de_la_escuela(client, db, make_spot, make_user):
    beach = make_spot(name="Playa", category="Surf")
    school = SurfSchool(spot_id=beach.id, name="Ola", owner_email=THIRD)
    db.add(school)
    db.commit()
    make_user(OTHER)
    client.post(f"/surf-reviews/{school.id}", json={"rating": 5}, headers=as_user(OTHER))
    assert kinds(db, THIRD) == ["new_review"]
    assert inbox(db, OWNER) == [], "no al que cargó la playa"


# -------- Reportes --------

def test_reporte_avisa_al_admin_y_borrar_la_resenia_a_su_autor(client, db, make_spot, make_user):
    spot = make_spot()
    author = make_user(OTHER)
    review = Review(spot_id=spot.id, user_id=author.id, rating=1, comment="ofensivo")
    db.add(review)
    db.commit()
    client.post("/reports", json={"target_kind": "review", "target_id": review.id, "reason": "offensive"}, headers=as_user(THIRD))
    assert kinds(db, ADMIN) == ["admin_report"]
    client.post("/admin/reports/resolve", json={"target_kind": "review", "target_id": review.id, "action": "delete"}, headers=as_user(ADMIN))
    assert kinds(db, OTHER) == ["review_deleted"]
    assert inbox(db, THIRD) == [], "quien reportó no recibe nada"
