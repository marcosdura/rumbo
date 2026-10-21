"""Backend para las pruebas en el navegador (e2e/run.mjs). Nunca lo importa
el backend de producción.

- Base: SQLite descartable en una carpeta temporal, creada con las
  migraciones de Alembic (como los tests del backend). No toca la base real.
- Login: el token "e2e:<email>" reemplaza al de Google (como el X-User de
  backend/tests/conftest.py). El email de E2E_ADMIN es admin.
- Cloudinary: borrar fotos no sale a internet (las subidas las intercepta
  el navegador).
- Sin límite de pedidos por minuto.
- Datos de base: categorías, comodidades y algunos lugares publicados
  (trekking, escalada con un sector, una playa y una laguna) para los
  flujos que suman cosas a un lugar existente.

Uso: python e2e/backend_e2e.py <puerto>
"""
import os
import re
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.normpath(os.path.join(HERE, "..", "..", "backend"))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8010

db_dir = tempfile.mkdtemp(prefix="rumbo-e2e-")
DB_URL = "sqlite:///" + os.path.join(db_dir, "e2e.db").replace("\\", "/")
os.environ["DATABASE_URL"] = DB_URL
os.environ.setdefault("GOOGLE_CLIENT_ID", "e2e")
os.environ["ADMIN_EMAIL"] = os.environ.get("E2E_ADMIN", "admin@e2e.test")
os.environ["FRONTEND_URL"] = os.environ.get("E2E_FRONTEND", "http://localhost:3100")
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402

cfg = Config(os.path.join(BACKEND, "alembic.ini"))
cfg.set_main_option("script_location", os.path.join(BACKEND, "alembic"))
command.upgrade(cfg, "head")

import cloudinary.uploader  # noqa: E402
from fastapi import Depends  # noqa: E402

import auth  # noqa: E402
import main  # noqa: E402
from database import SessionLocal  # noqa: E402
from models import Amenity, Category, ClimbingSector, Route, SpotCategory, SpotDB, SpotImage, SurfDetail, User  # noqa: E402

cloudinary.uploader.destroy = lambda public_id: {"result": "ok"}
# Sin límite de pedidos por minuto (como los tests del backend): un
# recorrido crea varios lugares seguidos.
from limiter import limiter  # noqa: E402

limiter.enabled = False


def fake_current_user(credentials=Depends(auth.security)):
    token = credentials.credentials if credentials else ""
    if not token.startswith("e2e:"):
        return None
    email = token[4:]
    return {"email": email, "sub": email, "name": email.split("@")[0]}


main.app.dependency_overrides[auth.get_current_user] = fake_current_user

# Mismos ids que components/agregar-lugar/constants.ts (CATEGORIES).
CATEGORIES = {1: "Camping", 2: "Trekking", 3: "Escalada", 4: "Surf", 5: "Kayak", 6: "Glamping", 8: "Motorhome"}


def amenity_names() -> list[str]:
    src = open(os.path.join(HERE, "..", "components", "agregar-lugar", "constants.ts"), encoding="utf-8").read()
    block = src[src.index("AMENITY_CATEGORIES"):]
    return sorted({n for arr in re.findall(r"names:\s*\[([^\]]*)\]", block) for n in re.findall(r'"([^"]+)"', arr)})


def seed():
    db = SessionLocal()
    for cid, name in CATEGORIES.items():
        db.add(Category(id=cid, name=name))
    for name in amenity_names():
        db.add(Amenity(name=name))
    db.flush()
    owner = os.environ["ADMIN_EMAIL"]
    for email in (os.environ.get("E2E_USER", "ana@e2e.test"), owner):
        db.add(User(id=email, email=email, name=email.split("@")[0]))

    def spot(name, cat, **extra):
        s = SpotDB(name=name, slug=name.lower().replace(" ", "-"), description=f"{name}, para las pruebas.",
                   department=extra.pop("department", "Lavalleja"), category_id=cat, owner_email=owner, is_approved=True,
                   lat=-34.3, lng=-55.0, **extra)
        db.add(s)
        db.flush()
        # Las actividades del lugar salen de acá (como al crearlo por la API).
        db.add(SpotCategory(spot_id=s.id, category_id=cat, is_primary=True))
        return s

    cerro = spot("Cerro de Prueba", 2)
    # Con datos, para que la página de la ruta muestre sus pills.
    db.add(Route(spot_id=cerro.id, name="Sendero Uno", slug="sendero-uno", distance_km=8.5, duration_hours=3, difficulty="moderado", route_type="circular"))
    roca = spot("Roca de Prueba", 3)
    db.add(ClimbingSector(spot_id=roca.id, name="Sector Norte", slug="sector-norte"))
    playa = spot("Playa de Prueba", 4, department="Rocha")
    # Con foto: las páginas /lugares precargan la de las primeras cards.
    db.add(SpotImage(spot_id=playa.id, cloudinary_public_id="rumbo/spots/e2e/playa", is_main=True, order=0))
    spot("Laguna de Prueba", 5, department="Rocha")
    # Una escuela que vino del sistema viejo (su dirección era /surf/<nombre>-7).
    escuela = spot("Escuela de Prueba", 4, department="Rocha")
    db.add(SurfDetail(spot_id=escuela.id, operates_at="Playa de Prueba", legacy_id=7))
    db.commit()
    db.close()


seed()

if __name__ == "__main__":
    import uvicorn
    print(f"e2e backend en http://localhost:{PORT} (base {DB_URL})", flush=True)
    uvicorn.run(main.app, host="127.0.0.1", port=PORT, log_level="warning")
