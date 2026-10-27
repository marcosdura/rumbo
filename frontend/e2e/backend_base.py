"""Lo que comparten el backend de las pruebas (e2e/backend_e2e.py) y el de
`npm run local` (local/backend_local.py). Nunca lo importa producción.

- Base: SQLite, creada o puesta al día con las migraciones de Alembic.
- Login: el token "e2e:<email>" reemplaza al de Google (como el X-User de
  backend/tests/conftest.py). El email `admin` es admin.
- Cloudinary: borrar fotos no sale a internet.
- Sin límite de pedidos por minuto.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.normpath(os.path.join(HERE, "..", "..", "backend"))


def prepare(db_url: str, admin: str, frontend: str):
    """Deja la base al día y devuelve el módulo `main` del backend, ya
    parchado. Las variables tienen que estar antes de importarlo: database.py
    arma el engine y auth.py lee el admin al importarse."""
    os.environ["DATABASE_URL"] = db_url
    os.environ.setdefault("GOOGLE_CLIENT_ID", "e2e")
    os.environ["ADMIN_EMAIL"] = admin
    os.environ["FRONTEND_URL"] = frontend
    sys.path.insert(0, BACKEND)
    os.chdir(BACKEND)

    from alembic import command
    from alembic.config import Config

    cfg = Config(os.path.join(BACKEND, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND, "alembic"))
    command.upgrade(cfg, "head")

    import cloudinary.uploader
    from fastapi import Depends

    import auth
    import main
    from limiter import limiter

    cloudinary.uploader.destroy = lambda public_id: {"result": "ok"}
    # Un recorrido crea varios lugares seguidos (como en los tests del backend).
    limiter.enabled = False

    def fake_current_user(credentials=Depends(auth.security)):
        token = credentials.credentials if credentials else ""
        if not token.startswith("e2e:"):
            return None
        email = token[4:]
        return {"email": email, "sub": email, "name": email.split("@")[0]}

    main.app.dependency_overrides[auth.get_current_user] = fake_current_user
    return main


def amenity_names() -> list[str]:
    """Las comodidades que ofrece el formulario (components/agregar-lugar/constants.ts)."""
    src = open(os.path.join(HERE, "..", "components", "agregar-lugar", "constants.ts"), encoding="utf-8").read()
    block = src[src.index("AMENITY_CATEGORIES"):]
    return sorted({n for arr in re.findall(r"names:\s*\[([^\]]*)\]", block) for n in re.findall(r'"([^"]+)"', arr)})
