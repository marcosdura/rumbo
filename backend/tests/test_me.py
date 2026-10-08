"""/me: resumen del perfil, "Mis pedidos" y "Lugares que sugeriste"."""
import os
import tempfile

import pytest
from alembic import command
from sqlalchemy import create_engine, text

from conftest import ADMIN, DB_URL, OTHER, OWNER, alembic_config, as_user
from models import Category, Contribution, Favorite, Review, SpotDB, User


@pytest.fixture
def camping(db):
    category = Category(name="Camping")
    db.add(category)
    db.commit()
    return category


def create(client, camping, user, name="Camping del Arroyo", responsible=True):
    body = {"name": name, "description": "Lindo", "department": "Rocha", "category_id": camping.id, "is_responsible": responsible}
    return client.post("/spots", json=body, headers=as_user(user)).json()["id"]


# -------- Miembro desde --------

def test_users_me_trae_la_fecha_de_registro(client, db):
    db.add(User(id=OWNER, email=OWNER))
    db.commit()
    assert client.get("/users/me", headers=as_user(OWNER)).json()["created_at"]


# -------- Resumen --------

def test_resumen_cuenta_lo_de_cada_fila(client, db, make_spot, camping):
    db.add(User(id=OWNER, email=OWNER))
    mine = make_spot(name="Mío")
    rejected = make_spot(name="Rechazado", approved=False)
    rejected.rejected_at = rejected.created_at
    other = make_spot(name="Ajeno", owner=OTHER)
    db.add_all([
        Favorite(user_id=OWNER, spot_id=other.id),
        Review(user_id=OWNER, spot_id=other.id, rating=5),
        Contribution(spot_id=other.id, kind="climbing_sector", item_id=1, author_email=OWNER, status="pending", title="Placa Sur"),
    ])
    db.commit()
    create(client, camping, OWNER, name="Sugerido", responsible=False)
    s = client.get("/me/summary", headers=as_user(OWNER)).json()
    assert s["member_since"]
    assert (s["favorites"], s["reviews"]) == (1, 1)
    # Mío + Rechazado + el sugerido (mientras se revisa lo maneja quien lo cargó).
    assert (s["managed"], s["managed_rejected"]) == (3, 1)
    assert s["suggested"] == 1
    assert (s["contributions"], s["contributions_pending"]) == (1, 1)
    assert (s["requests"], s["requests_pending"]) == (0, 0)
    assert mine.id


# -------- Mis pedidos --------

def test_pedido_de_cambio_de_un_lugar_aparece_en_revision(client, make_spot):
    spot = make_spot(name="Mío")
    client.patch(f"/admin/spots/{spot.id}", json={"name": "Nuevo nombre"}, headers=as_user(OWNER))
    items = client.get("/me/requests", headers=as_user(OWNER)).json()
    assert [(i["kind"], i["status"], i["fields"], i["target"]["name"]) for i in items] == [("spot_change", "pending", ["name"], "Mío")]
    assert items[0]["target"]["href"] == f"/dashboard/spots/{spot.id}"
    assert client.get("/me/summary", headers=as_user(OWNER)).json()["requests_pending"] == 1


def test_pedido_para_hacerse_cargo_rechazado_se_ve_hasta_cerrarlo(client, make_spot):
    suggested = make_spot(name="Sugerido", owner=ADMIN, suggested_by_visitor=True)
    claim_id = client.post(f"/spots/{suggested.id}/claims", json={}, headers=as_user(OTHER)).json()["id"]
    # En revisión: no se puede cerrar.
    assert client.post(f"/me/claims/{claim_id}/dismiss", headers=as_user(OTHER)).status_code == 409
    client.post(f"/admin/claims/{claim_id}/reject", json={"reason": "No pudimos verificarlo"}, headers=as_user(ADMIN))
    items = client.get("/me/requests", headers=as_user(OTHER)).json()
    assert [(i["kind"], i["status"], i["reject_reason"]) for i in items] == [("claim", "rejected", "No pudimos verificarlo")]
    # Ajeno: 404.
    assert client.post(f"/me/claims/{claim_id}/dismiss", headers=as_user(OWNER)).status_code == 404
    assert client.post(items[0]["dismiss_url"], headers=as_user(OTHER)).status_code == 200
    assert client.get("/me/requests", headers=as_user(OTHER)).json() == []


# -------- Lugares que sugeriste --------

def test_lo_sugerido_sigue_apareciendo_despues_de_aprobado(client, camping):
    spot_id = create(client, camping, OTHER, responsible=False)
    create(client, camping, OTHER, name="Mío de verdad", responsible=True)
    pending = client.get("/me/suggested", headers=as_user(OTHER)).json()
    assert [(s["name"], s["status"], s["slug"]) for s in pending] == [("Camping del Arroyo", "pending", None)]

    client.patch(f"/admin/spots/{spot_id}/approve", params={"approved": True}, headers=as_user(ADMIN))
    approved = client.get("/me/suggested", headers=as_user(OTHER)).json()
    assert approved[0]["status"] == "approved" and approved[0]["slug"]
    # Ya no lo administra.
    assert client.get("/me/summary", headers=as_user(OTHER)).json()["managed"] == 1


def test_migracion_copia_quien_sugirio_los_que_estan_en_revision():
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    try:
        command.upgrade(alembic_config(url), "0014")
        engine = create_engine(url)
        with engine.begin() as c:
            c.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Camping')"))
            rows = [(1, "visitante@test.com", 1, 0), (2, ADMIN, 1, 1), (3, OWNER, 0, 0)]
            for spot_id, owner, suggested, approved in rows:
                c.execute(text(
                    "INSERT INTO spots (id, name, description, department, category_id, owner_email, is_approved, suggested_by_visitor) "
                    "VALUES (:id, 'x', 'x', 'Rocha', 1, :owner, :approved, :suggested)"),
                    {"id": spot_id, "owner": owner, "approved": approved, "suggested": suggested})
        command.upgrade(alembic_config(url), "head")
        with engine.connect() as c:
            got = c.execute(text("SELECT id, suggested_by_email FROM spots ORDER BY id")).all()
        engine.dispose()
        assert [tuple(r) for r in got] == [(1, "visitante@test.com"), (2, None), (3, None)]
    finally:
        os.environ["DATABASE_URL"] = DB_URL
