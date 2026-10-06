"""Aportes a spots aprobados (contributions.py): quién puede sumar qué, qué
queda pendiente, y aprobar / rechazar / retirar."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user, every
from contributions import public_id_from_url
from models import (
    Category, ClimbingRoute, ClimbingSector, Contribution, Experience, GlampingDetail,
    KayakDetail, Route, SpotCategory, SurfSchool,
)

CLOUD_URL = "https://res.cloudinary.com/demo/image/upload/v1712/rumbo/spots/{spot}/{n:016x}.jpg"


@pytest.fixture
def surf_category(db):
    cat = Category(name="Surf")
    db.add(cat)
    db.commit()
    return cat


# Cómo se crea cada tipo de aporte: (kind, función que hace el POST).
def post_experience(client, spot, user, category_id):
    return client.post(f"/spots/{spot.id}/experiences", json={"category_id": category_id, "title": "Clase de surf"}, headers=as_user(user))


def post_glamping(client, spot, user):
    return client.post(f"/glamping/spots/{spot.id}/glamping", json={"accommodation_type": "domo", "capacity": 2}, headers=as_user(user))


def post_trekking(client, spot, user):
    return client.post("/routes/", json={"spot_id": spot.id, "name": "Sendero al mirador"}, headers=as_user(user))


def post_sector(client, spot, user, name="Sector Norte"):
    return client.post("/sectors/", json={"spot_id": spot.id, "name": name}, headers=as_user(user))


def post_climbing_route(client, sector_id, user, name="La Diagonal"):
    return client.post("/climbingroutes/", json={"sector_id": sector_id, "name": name, "grade": "6a"}, headers=as_user(user))


def post_surf(client, spot, user, photos=0):
    body = {"spot_id": spot.id, "name": "Escuela Ola"}
    for i in range(photos):
        body[f"photo_{i + 1}"] = CLOUD_URL.format(spot=spot.id, n=i)
    return client.post("/surfschool/", json=body, headers=as_user(user))


def post_kayak(client, spot, user):
    return client.post("/kayak/", json={"spot_id": spot.id, "name": "Kayak Laguna"}, headers=as_user(user))


def contribution_of(db, kind):
    return db.query(Contribution).filter_by(kind=kind).one()


def admin_list(client):
    return client.get("/admin/contributions", headers=as_user(ADMIN)).json()


def mine(client, user=OWNER):
    return client.get("/contributions/mine", headers=as_user(user)).json()


# -------- Quién puede sumar y cómo queda --------

OWNER_ONLY = [
    ("glamping_unit", post_glamping, GlampingDetail),
    ("trekking_route", post_trekking, Route),
    ("surf_school", post_surf, SurfSchool),
    ("kayak", post_kayak, KayakDetail),
]


@pytest.mark.parametrize("kind,post,model", OWNER_ONLY)
def test_duenio_en_spot_aprobado_queda_pendiente(client, db, make_spot, kind, post, model):
    spot = make_spot()
    r = post(client, spot, OWNER)
    assert r.status_code == 200, r.text
    assert r.json()["is_approved"] is False
    assert every(db, model).one().is_approved is False
    c = contribution_of(db, kind)
    assert (c.status, c.author_email, c.spot_id) == ("pending", OWNER, spot.id)


@pytest.mark.parametrize("kind,post,model", OWNER_ONLY)
def test_duenio_en_spot_no_aprobado_va_directo(client, db, make_spot, kind, post, model):
    spot = make_spot(approved=False)
    assert post(client, spot, OWNER).json()["is_approved"] is True
    assert db.query(Contribution).count() == 0


@pytest.mark.parametrize("kind,post,model", OWNER_ONLY)
def test_admin_va_directo(client, db, make_spot, kind, post, model):
    spot = make_spot()
    assert post(client, spot, ADMIN).json()["is_approved"] is True
    assert db.query(Contribution).count() == 0


@pytest.mark.parametrize("kind,post,model", OWNER_ONLY)
def test_otro_usuario_no_puede(client, db, make_spot, kind, post, model):
    spot = make_spot()
    assert post(client, spot, OTHER).status_code == 403
    assert every(db, model).count() == 0


def test_experiencia_pendiente_no_suma_su_categoria_hasta_aprobarse(client, db, make_spot, surf_category):
    spot = make_spot()
    r = post_experience(client, spot, OWNER, surf_category.id)
    assert r.json()["is_approved"] is False
    assert db.query(SpotCategory).count() == 0, "si no, el spot aparecería en búsquedas de Surf antes de la revisión"

    c = contribution_of(db, "experience")
    assert client.post(f"/admin/contributions/{c.id}/approve", headers=as_user(ADMIN)).status_code == 200
    db.expire_all()
    assert every(db, Experience).one().is_approved is True
    assert db.query(SpotCategory).filter_by(spot_id=spot.id, category_id=surf_category.id).count() == 1


def test_experiencia_de_otro_usuario(client, make_spot, surf_category):
    spot = make_spot()
    assert post_experience(client, spot, OTHER, surf_category.id).status_code == 403


# -------- Escalada: abierta a cualquiera --------

def test_cualquiera_sugiere_un_sector_en_un_spot_ajeno(client, db, make_spot):
    spot = make_spot()
    r = post_sector(client, spot, OTHER)
    assert r.status_code == 200
    assert r.json()["is_approved"] is False
    assert contribution_of(db, "climbing_sector").author_email == OTHER


def test_el_duenio_tambien_pasa_por_revision_en_escalada(client, make_spot):
    spot = make_spot()
    assert post_sector(client, spot, OWNER).json()["is_approved"] is False


def test_no_se_sugieren_sectores_en_un_spot_ajeno_sin_aprobar(client, make_spot):
    spot = make_spot(approved=False)
    assert post_sector(client, spot, OTHER).status_code == 403


def test_sector_inexistente(client):
    assert client.post("/sectors/", json={"spot_id": 999, "name": "x"}, headers=as_user(OTHER)).status_code == 404


def test_vias_dentro_del_sector_sugerido_van_con_el(client, db, make_spot):
    spot = make_spot()
    sector_id = post_sector(client, spot, OTHER).json()["id"]
    r = post_climbing_route(client, sector_id, OTHER)
    assert r.status_code == 200
    assert r.json()["is_approved"] is False
    assert db.query(Contribution).count() == 1, "la vía no tiene registro propio: va con el sector"

    c = contribution_of(db, "climbing_sector")
    client.post(f"/admin/contributions/{c.id}/approve", headers=as_user(ADMIN))
    db.expire_all()
    assert every(db, ClimbingSector).one().is_approved is True
    assert every(db, ClimbingRoute).one().is_approved is True


def test_nadie_mas_carga_vias_en_un_sector_sugerido_pendiente(client, make_spot):
    spot = make_spot()
    sector_id = post_sector(client, spot, OTHER).json()["id"]
    assert post_climbing_route(client, sector_id, OWNER).status_code == 404


def test_via_nueva_en_un_sector_aprobado_es_su_propio_aporte(client, db, make_spot):
    spot = make_spot()
    sector = ClimbingSector(spot_id=spot.id, name="Aprobado")
    db.add(sector)
    db.commit()
    r = post_climbing_route(client, sector.id, OTHER)
    assert r.json()["is_approved"] is False
    c = contribution_of(db, "climbing_route")
    assert (c.author_email, c.title) == (OTHER, "La Diagonal")


def test_rechazar_un_sector_borra_sus_vias(client, db, make_spot):
    spot = make_spot()
    sector_id = post_sector(client, spot, OTHER).json()["id"]
    post_climbing_route(client, sector_id, OTHER)
    c = contribution_of(db, "climbing_sector")
    client.post(f"/admin/contributions/{c.id}/reject", json={}, headers=as_user(ADMIN))
    assert every(db, ClimbingSector).count() == 0
    assert every(db, ClimbingRoute).count() == 0


# -------- Admin --------

def test_listado_admin_solo_para_admin(client, make_spot):
    post_sector(client, make_spot(), OTHER)
    assert client.get("/admin/contributions", headers=as_user(OWNER)).status_code == 403


def test_listado_admin_trae_el_elemento_y_el_spot(client, make_spot):
    spot = make_spot()
    sector_id = post_sector(client, spot, OTHER).json()["id"]
    post_climbing_route(client, sector_id, OTHER)
    [entry] = admin_list(client)
    assert entry["kind"] == "climbing_sector"
    assert entry["author_email"] == OTHER
    assert entry["spot"]["name"] == "Cascada Escondida"
    assert entry["item"]["name"] == "Sector Norte"
    assert [r["name"] for r in entry["item"]["routes"]] == ["La Diagonal"]


def test_rechazar_borra_el_elemento_y_sus_fotos(client, db, make_spot, destroyed):
    spot = make_spot()
    post_surf(client, spot, OWNER, photos=2)
    c = contribution_of(db, "surf_school")
    r = client.post(f"/admin/contributions/{c.id}/reject", json={"reason": " Faltan datos de contacto "}, headers=as_user(ADMIN))
    assert r.status_code == 200
    assert every(db, SurfSchool).count() == 0
    assert destroyed == [f"rumbo/spots/{spot.id}/{0:016x}", f"rumbo/spots/{spot.id}/{1:016x}"]
    [visto] = mine(client)
    assert (visto["status"], visto["reject_reason"], visto["title"]) == ("rejected", "Faltan datos de contacto", "Escuela Ola")


def test_no_se_resuelve_dos_veces(client, db, make_spot):
    post_kayak(client, make_spot(), OWNER)
    c = contribution_of(db, "kayak")
    client.post(f"/admin/contributions/{c.id}/approve", headers=as_user(ADMIN))
    assert client.post(f"/admin/contributions/{c.id}/reject", json={}, headers=as_user(ADMIN)).status_code == 409


def test_cada_aporte_se_revisa_por_separado(client, db, make_spot):
    # Sin "uno a la vez": un aporte pendiente no bloquea otros en el mismo spot.
    spot = make_spot()
    post_sector(client, spot, OTHER, name="A")
    post_sector(client, spot, OWNER, name="B")
    post_trekking(client, spot, OWNER)
    assert len(admin_list(client)) == 3


# -------- Autor --------

def test_retirar_un_aporte_pendiente(client, db, make_spot, destroyed):
    spot = make_spot()
    post_surf(client, spot, OWNER, photos=1)
    c = contribution_of(db, "surf_school")
    assert client.post(f"/contributions/{c.id}/withdraw", headers=as_user(OWNER)).status_code == 200
    assert every(db, SurfSchool).count() == 0
    assert destroyed == [f"rumbo/spots/{spot.id}/{0:016x}"]
    assert mine(client) == [], "los retirados no se muestran"


def test_no_se_retira_un_aporte_ajeno(client, db, make_spot):
    post_sector(client, make_spot(), OTHER)
    c = contribution_of(db, "climbing_sector")
    assert client.post(f"/contributions/{c.id}/withdraw", headers=as_user(OWNER)).status_code == 404


def test_no_se_retira_un_aporte_ya_aprobado(client, db, make_spot):
    post_sector(client, make_spot(), OTHER)
    c = contribution_of(db, "climbing_sector")
    client.post(f"/admin/contributions/{c.id}/approve", headers=as_user(ADMIN))
    assert client.post(f"/contributions/{c.id}/withdraw", headers=as_user(OTHER)).status_code == 409


def test_cerrar_el_aviso(client, db, make_spot):
    post_sector(client, make_spot(), OTHER)
    c = contribution_of(db, "climbing_sector")
    assert client.post(f"/contributions/{c.id}/dismiss", headers=as_user(OTHER)).status_code == 409, "pendiente: no hay nada que cerrar"
    client.post(f"/admin/contributions/{c.id}/approve", headers=as_user(ADMIN))
    assert mine(client, OTHER)[0]["status"] == "approved"
    client.post(f"/contributions/{c.id}/dismiss", headers=as_user(OTHER))
    assert mine(client, OTHER) == []


def test_borrar_un_elemento_pendiente_retira_el_aporte(client, db, make_spot, surf_category):
    spot = make_spot()
    exp_id = post_experience(client, spot, OWNER, surf_category.id).json()["id"]
    r = client.delete(f"/spots/{spot.id}/experiences/{exp_id}", headers=as_user(OWNER))
    assert r.status_code == 200
    assert contribution_of(db, "experience").status == "withdrawn"
    assert admin_list(client) == []


def test_borrar_glamping_pendiente_retira_el_aporte(client, db, make_spot):
    spot = make_spot()
    glamping_id = post_glamping(client, spot, OWNER).json()["id"]
    client.delete(f"/glamping/glamping/{glamping_id}", headers=as_user(OWNER))
    assert contribution_of(db, "glamping_unit").status == "withdrawn"


# -------- Casos borde --------

def test_borrar_el_spot_borra_fotos_de_surf_y_kayak(client, db, make_spot, destroyed):
    spot = make_spot(approved=False)
    post_surf(client, spot, OWNER, photos=2)
    r = client.delete(f"/spots/{spot.id}", headers=as_user(ADMIN))
    assert r.status_code == 200
    assert f"rumbo/spots/{spot.id}/{1:016x}" in destroyed
    assert db.query(Contribution).count() == 0


def test_borrar_la_cuenta_retira_sus_aportes_en_spots_ajenos(client, db, make_spot, make_user):
    spot = make_spot()
    post_sector(client, spot, OTHER)
    make_user(OTHER)
    assert client.delete("/users/me", headers=as_user(OTHER)).status_code == 200
    assert contribution_of(db, "climbing_sector").status == "withdrawn"
    assert every(db, ClimbingSector).count() == 0


@pytest.mark.parametrize("url,expected", [
    ("https://res.cloudinary.com/demo/image/upload/v1712/rumbo/spots/4/abc.jpg", "rumbo/spots/4/abc"),
    ("https://res.cloudinary.com/demo/image/upload/rumbo/spots/4/abc.webp", "rumbo/spots/4/abc"),
    ("https://res.cloudinary.com/demo/image/upload/w_280,h_220,c_fill/v1/Surf/Ola/Ola1.png", "Surf/Ola/Ola1"),
    ("", None),
    (None, None),
])
def test_public_id_desde_url(url, expected):
    assert public_id_from_url(url) == expected


# -------- Dashboard del dueño --------

def test_el_duenio_ve_sus_pendientes_en_el_dashboard(client, db, make_spot, surf_category):
    spot = make_spot()
    db.add(GlampingDetail(spot_id=spot.id, accommodation_type="domo"))
    db.commit()
    post_experience(client, spot, OWNER, surf_category.id)
    post_glamping(client, spot, OWNER)
    r = client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OWNER))
    assert r.status_code == 200
    body = r.json()
    assert [e["is_approved"] for e in body["experiences"]] == [False]
    assert [g["is_approved"] for g in body["glamping_units"]] == [True, False]
    # La lectura pública sigue sin mostrarlas.
    assert client.get(f"/spots/{spot.id}/experiences").json() == []


def test_owner_content_solo_para_el_duenio(client, make_spot):
    spot = make_spot()
    assert client.get(f"/spots/{spot.id}/owner-content", headers=as_user(OTHER)).status_code == 403
