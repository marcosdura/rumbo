"""Configuración compartida de los tests del backend.

- Base: SQLite en un archivo temporal, creada con las migraciones de Alembic
  (no con create_all): si una migración no coincide con models.py, los tests
  lo notan. Se crea una vez por corrida y se vacía entre test y test.
- Login: el header "X-User: <email>" reemplaza al token de Google.
  ADMIN_EMAIL es admin@test.com.
- Cloudinary: destroy() no sale a internet; los ids que se mandaron a borrar
  quedan en el fixture `destroyed`.
- Rate limit apagado: varios tests hacen más de 20 requests por minuto.
"""
import os
import sys
import tempfile

# Todo esto tiene que estar antes de importar la app: database.py arma el
# engine y auth.py exige GOOGLE_CLIENT_ID al importarse.
_DB_DIR = tempfile.mkdtemp(prefix="rumbo-tests-")
DB_URL = "sqlite:///" + os.path.join(_DB_DIR, "test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = DB_URL
os.environ["GOOGLE_CLIENT_ID"] = "test-client-id"
os.environ["ADMIN_EMAIL"] = "admin@test.com"

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import pytest
from alembic import command
from alembic.config import Config
from fastapi import Request
from fastapi.testclient import TestClient


def alembic_config(db_url: str) -> Config:
    cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    # env.py lee DATABASE_URL del entorno.
    os.environ["DATABASE_URL"] = db_url
    return cfg


command.upgrade(alembic_config(DB_URL), "head")

import cloudinary.uploader  # noqa: E402
import auth  # noqa: E402
import main  # noqa: E402
from database import Base, SessionLocal  # noqa: E402
from limiter import limiter  # noqa: E402
from models import Category, SpotDB, SpotImage, User  # noqa: E402

limiter.enabled = False

OWNER = "owner@test.com"
OTHER = "other@test.com"
ADMIN = "admin@test.com"


def as_user(email: str) -> dict:
    return {"X-User": email}


def _fake_current_user(request: Request):
    email = request.headers.get("x-user")
    return {"email": email, "sub": email} if email else None


main.app.dependency_overrides[auth.get_current_user] = _fake_current_user


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(autouse=True)
def clean_db():
    yield
    session = SessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    session.close()


@pytest.fixture(autouse=True)
def destroyed(monkeypatch):
    """Ids que el backend mandó a borrar de Cloudinary, en orden."""
    calls = []
    monkeypatch.setattr(cloudinary.uploader, "destroy", lambda public_id: calls.append(public_id) or {"result": "ok"})
    return calls


def every(db, model):
    """Consulta que también ve los aportes pendientes, que el filtro global
    (models.hide_pending_contributions) oculta. Para inspeccionar la base."""
    return db.query(model).execution_options(include_pending=True)


def new_photo_id(spot_id: int, n: int) -> str:
    """Formato que arma lib/uploadImage.ts, tal como lo devuelve Cloudinary."""
    return f"rumbo/spots/{spot_id}/{n:016x}"


@pytest.fixture
def make_spot(db):
    """Crea un spot con `photos` fotos ya publicadas (la primera, principal)."""
    def _make(name="Cascada Escondida", owner=OWNER, approved=True, photos=0, category="Camping", **fields):
        category_name = category
        category = db.query(Category).filter_by(name=category_name).first()
        if not category:
            category = Category(name=category_name)
            db.add(category)
            db.flush()
        spot = SpotDB(
            name=name, description=fields.pop("description", "Una cascada linda"),
            department=fields.pop("department", "Rocha"), owner_email=owner,
            is_approved=approved, category_id=category.id,
            slug=fields.pop("slug", name.lower().replace(" ", "-")), **fields,
        )
        db.add(spot)
        db.flush()
        for i in range(photos):
            db.add(SpotImage(spot_id=spot.id, cloudinary_public_id=f"viejas/{spot.id}/{i}", is_main=(i == 0), order=i))
        db.commit()
        db.refresh(spot)
        return spot
    return _make


@pytest.fixture
def make_user(db):
    def _make(email):
        user = User(id=email, email=email)
        db.add(user)
        db.commit()
        return user
    return _make
