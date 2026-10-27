"""Backend para las pruebas en el navegador (e2e/run.mjs). Nunca lo importa
el backend de producción.

- Base: SQLite descartable en una carpeta temporal. Login de prueba,
  Cloudinary sin salir a internet y sin límite de pedidos: backend_base.py.
- Pronóstico: siempre el mismo, sin salir a internet.
- Datos de base: categorías, comodidades y algunos lugares publicados
  (trekking, escalada con un sector, una playa y una laguna) para los
  flujos que suman cosas a un lugar existente.

Uso: python e2e/backend_e2e.py <puerto>
"""
import os
import sys
import tempfile

from backend_base import amenity_names, prepare

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8010

db_dir = tempfile.mkdtemp(prefix="rumbo-e2e-")
DB_URL = "sqlite:///" + os.path.join(db_dir, "e2e.db").replace("\\", "/")
main = prepare(DB_URL, os.environ.get("E2E_ADMIN", "admin@e2e.test"), os.environ.get("E2E_FRONTEND", "http://localhost:3100"))

from database import SessionLocal  # noqa: E402
from models import Amenity, Category, ClimbingSector, Route, SpotCategory, SpotDB, SpotImage, SurfDetail, User  # noqa: E402

# El pronóstico no sale a internet: siempre el mismo (forecast.py).
import forecast  # noqa: E402
FAKE_WEATHER = {"daily": {
    "time": ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"],
    "weather_code": [0, 2, 61, 95, 3], "temperature_2m_max": [24, 22, 18, 19, 21],
    "temperature_2m_min": [12, 13, 11, 10, 12], "precipitation_probability_max": [0, 10, 80, 90, 20],
    "wind_speed_10m_max": [12, 18, 30, 40, 15], "wind_direction_10m_dominant": [90, 135, 180, 225, 0],
}}
FAKE_MARINE = {"daily": {
    "time": FAKE_WEATHER["daily"]["time"], "wave_height_max": [1.2, 0.8, 1.6, 2.1, 1.0],
    "wave_period_max": [8, 7, 9, 10, 8], "wave_direction_dominant": [135, 135, 180, 180, 90],
}}
forecast._get = lambda url, params: FAKE_MARINE if url == forecast.MARINE_URL else FAKE_WEATHER

# Mismos ids que components/agregar-lugar/constants.ts (CATEGORIES).
CATEGORIES = {1: "Camping", 2: "Trekking", 3: "Escalada", 4: "Surf", 5: "Kayak", 6: "Glamping", 8: "Motorhome"}


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
    # Dos fotos: en la compu van en grilla (a 640px), así se nota si algo la
    # pide más grande (la galería oculta del celular).
    db.add(SpotImage(spot_id=playa.id, cloudinary_public_id="rumbo/spots/e2e/playa-2", is_main=False, order=1))
    # Un email largo (como el de Bichadero en producción): en el celular no\n    # entra en una línea y tiene que cortar después de la @.
    spot("Laguna de Prueba", 5, department="Rocha", email="reservas.lagunita@gmail.com")
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
