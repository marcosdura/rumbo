"""Quién puede reseñar qué: solo lugares publicados, y no los propios."""
from datetime import datetime

import pytest

from conftest import OTHER, as_user
from models import Review


@pytest.mark.parametrize("state", [
    {"approved": False},
    {"approved": False, "rejected_at": datetime(2026, 10, 1)},
    {"owner_deleted_at": datetime(2026, 10, 1)},
])
def test_no_se_resenia_un_lugar_no_publicado(client, db, make_spot, make_user, state):
    spot = make_spot(**state)
    make_user(OTHER)
    r = client.post(f"/reviews/{spot.id}", json={"rating": 5}, headers=as_user(OTHER))
    assert r.status_code == 404
    assert db.query(Review).count() == 0


def test_un_lugar_publicado_si(client, db, make_spot, make_user):
    spot = make_spot()
    make_user(OTHER)
    assert client.post(f"/reviews/{spot.id}", json={"rating": 4}, headers=as_user(OTHER)).status_code == 201
