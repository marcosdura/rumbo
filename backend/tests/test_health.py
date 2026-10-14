"""GET /health y la conexión a la base."""
from database import engine, get_db
from main import app


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_sin_base_da_503_sin_detalles(client):
    class Rota:
        def execute(self, *_):
            raise RuntimeError("connection refused: postgres://usuario:clave@host")

    before = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = lambda: Rota()
    try:
        r = client.get("/health")
    finally:
        if before is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = before
    assert r.status_code == 503
    assert r.json() == {"status": "error"}
    assert "clave" not in r.text


def test_las_conexiones_se_revisan_antes_de_usarlas():
    # Si Postgres se reinició, una conexión muerta se descarta en vez de dar 500.
    assert engine.pool._pre_ping is True
    assert engine.pool._recycle == 1800
