"""Backend de `npm run local` (local/run.mjs): Rumbo entero en tu compu, para
mirar cambios sin tocar producción. Nunca lo importa producción.

- Base: un SQLite en .rumbo-local/ (fuera del repo: está en el .gitignore).
  La primera vez se llena con backend/demo_data.py; después se reusa, con
  lo que hayas cargado. Login de prueba, Cloudinary sin salir a internet y
  sin límite de pedidos: e2e/backend_base.py.
- Pronóstico: el real de Open-Meteo (solo lee; no manda nada tuyo).

Uso: python local/backend_local.py <puerto> <archivo .db>
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "e2e"))
from backend_base import amenity_names, prepare  # noqa: E402

PORT = int(sys.argv[1])
DB_FILE = os.path.abspath(sys.argv[2])
ADMIN = os.environ["LOCAL_ADMIN"]
USERS = os.environ["LOCAL_USERS"].split(",")

fresh = not os.path.exists(DB_FILE)
main = prepare("sqlite:///" + DB_FILE.replace("\\", "/"), ADMIN, os.environ["LOCAL_FRONTEND"])

if fresh:
    import demo_data  # noqa: E402
    from database import SessionLocal  # noqa: E402

    db = SessionLocal()
    demo_data.load(db, ADMIN, USERS, amenity_names())
    db.close()

if __name__ == "__main__":
    import uvicorn
    print(f"backend local en http://localhost:{PORT} (base {DB_FILE})", flush=True)
    uvicorn.run(main.app, host="127.0.0.1", port=PORT, log_level="warning")
