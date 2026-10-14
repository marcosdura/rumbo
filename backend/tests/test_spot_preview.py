"""GET /spots/{id}/preview: la página de un lugar aunque no esté publicado,
para el admin y su dueño (antes el "Ver" del admin daba 404)."""
from conftest import ADMIN, OTHER, OWNER, as_user


def test_el_admin_ve_un_lugar_nuevo(client, make_spot):
    spot = make_spot(name="Camping Nuevo", approved=False, photos=1)
    assert client.get("/spots/by-slug/camping-nuevo").status_code == 404, "la página pública sigue sin mostrarlo"
    r = client.get(f"/spots/{spot.id}/preview", headers=as_user(ADMIN))
    assert r.status_code == 200, r.text
    body = r.json()
    assert (body["name"], body["review_count"], len(body["images"])) == ("Camping Nuevo", 0, 1)


def test_el_duenio_ve_el_suyo(client, make_spot):
    spot = make_spot(approved=False)
    assert client.get(f"/spots/{spot.id}/preview", headers=as_user(OWNER)).status_code == 200


def test_nadie_mas(client, make_spot):
    spot = make_spot(approved=False)
    assert client.get(f"/spots/{spot.id}/preview", headers=as_user(OTHER)).status_code == 403
    assert client.get(f"/spots/{spot.id}/preview").status_code in (401, 403)
    assert client.get("/spots/9999/preview", headers=as_user(ADMIN)).status_code == 404


def test_un_lugar_despublicado_tambien(client, make_spot):
    from datetime import datetime
    spot = make_spot(approved=False, rejected_at=datetime(2026, 10, 1), rejection_reason="Faltan fotos")
    assert client.get(f"/spots/{spot.id}/preview", headers=as_user(ADMIN)).json()["name"] == "Cascada Escondida"
