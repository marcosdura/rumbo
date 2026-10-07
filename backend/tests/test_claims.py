"""Reclamar un lugar sugerido por un visitante (claims.py)."""
import pytest

from conftest import ADMIN, OTHER, OWNER, as_user
from models import SpotDB

CLAIMER = "duenio@test.com"


@pytest.fixture
def suggested(make_spot):
    """Lugar publicado que cargó un visitante: ya es del admin."""
    return make_spot(name="Camping del Arroyo", owner=ADMIN, suggested_by_visitor=True)


def claim(client, spot_id, user=CLAIMER, message="Soy el encargado, mi teléfono es 099..."):
    return client.post(f"/spots/{spot_id}/claims", json={"message": message}, headers=as_user(user))


def notifications(client, user):
    return [n["title"] for n in client.get("/notifications/", headers=as_user(user)).json()["items"]]


def test_la_pagina_del_lugar_dice_que_lo_sugirio_un_visitante(client, suggested):
    assert client.get(f"/spots/{suggested.id}").json()["suggested_by_visitor"] is True


def test_pedirlo_queda_en_revision_y_le_avisa_al_admin(client, suggested):
    r = claim(client, suggested.id)
    assert r.status_code == 201
    assert client.get(f"/spots/{suggested.id}/claims/mine", headers=as_user(CLAIMER)).json() == {"pending": True}
    pending = client.get("/admin/claims", headers=as_user(ADMIN)).json()
    assert [(c["user_email"], c["spot"]["name"]) for c in pending] == [(CLAIMER, "Camping del Arroyo")]
    assert pending[0]["message"].startswith("Soy el encargado")
    assert notifications(client, ADMIN) == ["Alguien reclama «Camping del Arroyo» como responsable"]


def test_hace_falta_estar_logueado(client, suggested):
    assert client.post(f"/spots/{suggested.id}/claims", json={}).status_code == 401


def test_un_solo_pedido_en_revision_por_persona(client, suggested):
    claim(client, suggested.id)
    assert claim(client, suggested.id).status_code == 409


def test_un_lugar_comun_no_se_puede_reclamar(client, make_spot):
    spot = make_spot(name="Camping propio")
    assert claim(client, spot.id).status_code == 400


def test_aprobarlo_le_da_el_lugar_y_le_avisa(client, db, suggested):
    claim_id = claim(client, suggested.id).json()["id"]
    claim(client, suggested.id, user=OTHER)
    assert client.post(f"/admin/claims/{claim_id}/approve", headers=as_user(ADMIN)).status_code == 200
    db.expire_all()
    spot = db.get(SpotDB, suggested.id)
    assert spot.owner_email == CLAIMER
    assert spot.suggested_by_visitor is False
    # Ahora lo administra, y aparece en sus lugares.
    assert client.patch(f"/admin/spots/{spot.id}", json={"price": 10}, headers=as_user(CLAIMER)).status_code == 200
    assert [s["name"] for s in client.get("/spots/mine", headers=as_user(CLAIMER)).json()] == ["Camping del Arroyo"]
    assert notifications(client, CLAIMER) == ["Ya sos el responsable de «Camping del Arroyo»"]
    # El otro pedido queda rechazado, con aviso.
    assert notifications(client, OTHER) == ["No se aprobó tu pedido sobre «Camping del Arroyo»"]
    assert client.get("/admin/claims", headers=as_user(ADMIN)).json() == []


def test_rechazarlo_pide_motivo_y_le_avisa(client, db, suggested):
    claim_id = claim(client, suggested.id).json()["id"]
    assert client.post(f"/admin/claims/{claim_id}/reject", json={"reason": ""}, headers=as_user(ADMIN)).status_code == 422
    assert client.post(f"/admin/claims/{claim_id}/reject", json={"reason": "No pudimos verificarlo"}, headers=as_user(ADMIN)).status_code == 200
    db.expire_all()
    assert db.get(SpotDB, suggested.id).owner_email == ADMIN
    items = client.get("/notifications/", headers=as_user(CLAIMER)).json()["items"]
    assert items[0]["body"] == "No pudimos verificarlo"
    # Puede volver a pedirlo.
    assert claim(client, suggested.id).status_code == 201


def test_solo_el_admin_resuelve(client, suggested):
    claim_id = claim(client, suggested.id).json()["id"]
    assert client.post(f"/admin/claims/{claim_id}/approve", headers=as_user(OWNER)).status_code == 403
    assert client.get("/admin/claims", headers=as_user(OWNER)).status_code == 403
