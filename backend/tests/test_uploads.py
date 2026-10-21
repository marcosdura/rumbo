"""Subidas a Cloudinary (uploads.py): cada firma deja un permiso, con tope
por usuario, y lo que nunca se registró se borra de Cloudinary."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from conftest import ADMIN, OTHER, OWNER, as_user, every
from models import SpotChangeRequest, SpotImage, UploadTicket
import uploads

NOW = datetime(2026, 10, 21, 12, 0, tzinfo=timezone.utc)


def can_upload(client, spot_id, n, user=OWNER):
    return client.get(f"/spots/{spot_id}/can-upload", params={"public_id": f"{spot_id}/{n:016x}"}, headers=as_user(user))


def tickets(db, email, n, spot_id, ago, start=0):
    for i in range(start, start + n):
        db.add(UploadTicket(public_id=f"rumbo/spots/{spot_id}/{i:016x}", spot_id=spot_id, user_email=email, created_at=NOW - ago))
    db.commit()


def test_cada_firma_deja_un_permiso_con_el_id_de_cloudinary(client, db, make_spot):
    spot = make_spot()
    assert can_upload(client, spot.id, 7).status_code == 200
    [ticket] = every(db, UploadTicket).all()
    assert (ticket.public_id, ticket.spot_id, ticket.user_email) == (f"rumbo/spots/{spot.id}/{7:016x}", spot.id, OWNER)


def test_reintentar_la_misma_subida_no_cuenta_dos_veces_y_otro_no_puede_usarla(client, db, make_spot):
    spot = make_spot()
    assert can_upload(client, spot.id, 7).status_code == 200
    assert can_upload(client, spot.id, 7).status_code == 200
    assert every(db, UploadTicket).count() == 1
    # El mismo archivo pedido por otra persona: no.
    with pytest.raises(HTTPException) as e:
        uploads.issue_ticket(db, spot.id, f"{spot.id}/{7:016x}", {"email": OTHER})
    assert e.value.status_code == 409


def test_tope_por_hora_y_por_dia_por_usuario(db, make_spot):
    spot = make_spot()
    user = {"email": OTHER}
    tickets(db, OTHER, uploads.HOUR_LIMIT, spot.id, timedelta(minutes=30))
    with pytest.raises(HTTPException) as e:
        uploads.issue_ticket(db, spot.id, f"{spot.id}/{999:016x}", user, now=NOW)
    assert e.value.status_code == 429 and "hora" in e.value.detail
    # Otra persona no comparte el tope.
    uploads.issue_ticket(db, spot.id, f"{spot.id}/{998:016x}", {"email": OWNER}, now=NOW)

    db.query(UploadTicket).delete(); db.commit()
    # Las de hace dos horas ya no cuentan para la hora, sí para el día.
    tickets(db, OTHER, uploads.DAY_LIMIT - 1, spot.id, timedelta(hours=2))
    uploads.issue_ticket(db, spot.id, f"{spot.id}/{997:016x}", user, now=NOW)
    with pytest.raises(HTTPException) as e:
        uploads.issue_ticket(db, spot.id, f"{spot.id}/{996:016x}", user, now=NOW)
    assert e.value.status_code == 429 and "hoy" in e.value.detail


def test_el_admin_no_tiene_tope(db, make_spot):
    spot = make_spot()
    tickets(db, ADMIN, uploads.DAY_LIMIT, spot.id, timedelta(minutes=5))
    uploads.issue_ticket(db, spot.id, f"{spot.id}/{999:016x}", {"email": ADMIN}, now=NOW)


def test_el_tope_llega_al_usuario_como_429(client, db, make_spot):
    spot = make_spot()
    tickets(db, OWNER, uploads.HOUR_LIMIT, spot.id, timedelta(minutes=1))
    db.query(UploadTicket).update({UploadTicket.created_at: datetime.now(timezone.utc) - timedelta(minutes=1)}); db.commit()
    assert can_upload(client, spot.id, 999).status_code == 429


def test_la_limpieza_borra_solo_lo_viejo_que_nunca_se_registro(db, make_spot, destroyed):
    spot = make_spot()
    pid = lambda n: f"rumbo/spots/{spot.id}/{n:016x}"
    tickets(db, OTHER, 4, spot.id, timedelta(hours=30))        # 0..3: viejos
    tickets(db, OTHER, 1, spot.id, timedelta(hours=2), start=4)  # 4: reciente
    # 0 quedó como foto del lugar y 1 en un pedido de cambio pendiente.
    db.add(SpotImage(spot_id=spot.id, cloudinary_public_id=pid(0), is_main=True, order=0))
    db.add(SpotChangeRequest(spot_id=spot.id, requested_by=OWNER, changes={"photos_added": [f"{spot.id}/{1:016x}"]}))
    db.commit()

    assert uploads.cleanup_orphans(db, now=NOW) == {"destroyed": 2, "kept": 2}
    assert destroyed == [pid(2), pid(3)]
    # Los permisos viejos se descartan; el reciente queda (cuenta para el tope).
    assert [t.public_id for t in every(db, UploadTicket)] == [pid(4)]
    assert uploads.cleanup_orphans(db, now=NOW) == {"destroyed": 0, "kept": 0}


def test_la_pasada_periodica_usa_su_propia_sesion_y_no_se_cae(db, make_spot, destroyed, monkeypatch):
    spot = make_spot()
    tickets(db, OTHER, 1, spot.id, timedelta(days=3))
    db.query(UploadTicket).update({UploadTicket.created_at: datetime.now(timezone.utc) - timedelta(days=3)}); db.commit()
    assert uploads.run_cleanup() == {"destroyed": 1, "kept": 0}
    assert destroyed == [f"rumbo/spots/{spot.id}/{0:016x}"]

    def boom(db):
        raise RuntimeError("Cloudinary caído")
    monkeypatch.setattr(uploads, "cleanup_orphans", boom)
    assert uploads.run_cleanup() is None


def test_el_servidor_arranca_y_se_apaga_con_la_limpieza_andando(monkeypatch):
    from fastapi.testclient import TestClient
    import main
    started = []

    async def fake_forever():
        started.append(True)
    monkeypatch.setattr(uploads, "cleanup_forever", fake_forever)
    with TestClient(main.app) as c:
        assert c.get("/health").status_code == 200
    assert started == [True]
    # Con UPLOAD_CLEANUP=off no arranca.
    monkeypatch.setenv("UPLOAD_CLEANUP", "off")
    with TestClient(main.app):
        pass
    assert started == [True]
