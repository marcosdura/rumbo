"""Datos de ejemplo para mirar el sitio en local (`npm run local` en frontend/).
Producción nunca lo importa.

Lugares de todas las actividades, en varios departamentos, con rutas,
sectores y vías, unidades de glamping, reseñas y un lugar esperando
revisión (para probar el panel admin). Las fotos son ids "rumbo/demo/...":
en local se dibujan solas (frontend/local/fotos.mjs), no están en Cloudinary.
"""
from models import (
    Amenity, CampingDetail, Category, ClimbingRoute, ClimbingSector, Favorite, GlampingAmenity,
    GlampingDetail, KayakServiceDetail, MotorhomeDetail, Review, Route, SpotAmenity, SpotCategory,
    SpotDB, SpotImage, SurfDetail, TrekkingDetail, User,
)
from slugs import generate_slug

# Mismos ids que components/agregar-lugar/constants.ts (CATEGORIES).
CATEGORIES = {1: "Camping", 2: "Trekking", 3: "Escalada", 4: "Surf", 5: "Kayak", 6: "Glamping", 8: "Motorhome"}


def load(db, admin: str, users: list[str], amenities: list[str]) -> None:
    """Carga todo en una base vacía (recién migrada). `admin` es el dueño de
    casi todo; el primero de `users` tiene un lugar propio y otro pendiente."""
    for cid, name in CATEGORIES.items():
        db.add(Category(id=cid, name=name))
    amenity = {}
    for name in amenities:
        amenity[name] = Amenity(name=name)
        db.add(amenity[name])
    for email in [admin, *users]:
        db.add(User(id=email, email=email, name=email.split("@")[0].capitalize()))
    db.flush()
    ana = users[0]

    def spot(name, cat, department, lat, lng, *, owner=admin, approved=True, photos=2, extras=(), comforts=(), **fields):
        slug = generate_slug(name)
        s = SpotDB(name=name, slug=slug, category_id=cat, department=department, lat=lat, lng=lng,
                   owner_email=owner, is_approved=approved,
                   description=fields.pop("description", f"{name}: lugar de ejemplo para probar Rumbo en local."),
                   **fields)
        db.add(s)
        db.flush()
        db.add(SpotCategory(spot_id=s.id, category_id=cat, is_primary=True))
        for other in extras:
            db.add(SpotCategory(spot_id=s.id, category_id=other, is_primary=False))
        for i in range(photos):
            db.add(SpotImage(spot_id=s.id, cloudinary_public_id=f"rumbo/demo/{slug}-{i + 1}", is_main=i == 0, order=i))
        for name_ in comforts:
            if name_ in amenity:
                db.add(SpotAmenity(spot_id=s.id, amenity_id=amenity[name_].id))
        return s

    def review(s, email, rating, comment):
        db.add(Review(spot_id=s.id, user_id=email, rating=rating, comment=comment))

    # Camping
    laguna = spot("Camping Laguna Negra", 1, "Rocha", -34.08, -53.70, price=600, whatsapp="099123456",
                  email="reservas@lagunanegra.example", season_start=11, season_end=4, is_public=False,
                  pets_allowed=True, reservation_required=False, cell_signal=True,
                  description="Camping entre médanos, a pasos de la laguna.\nParcelas con sombra y fogón.",
                  comforts=["Ducha", "Agua caliente", "Baños", "Parrillero", "Sombra", "Acepta mascotas"])
    db.add(CampingDetail(spot_id=laguna.id, price=600))
    review(laguna, ana, 5, "Muy tranquilo, las duchas con agua caliente.\nVolvería.")
    review(laguna, users[1], 4, "Lindo lugar, en enero se llena.")
    salto = spot("Camping Termas del Daymán", 1, "Salto", -31.45, -57.90, price=450, is_public=False,
                 comforts=["Ducha", "Piscina", "Electricidad", "WiFi"])
    db.add(CampingDetail(spot_id=salto.id, price=450))
    eden = spot("Camping Valle Edén", 1, "Tacuarembó", -31.83, -56.16, photos=0, is_public=True,
                comforts=["Baños", "Agua potable", "Zona para fogón"])
    review(eden, users[1], 3, None)

    # Glamping
    sierra = spot("Glamping Sierra Serena", 6, "Lavalleja", -34.36, -55.23, whatsapp="098765432",
                  instagram="sierraserena.example", reservation_required=True)
    db.add(GlampingDetail(spot_id=sierra.id, accommodation_type="domo", capacity=2, price_per_night=3500, min_nights=2))
    db.add(GlampingDetail(spot_id=sierra.id, accommodation_type="cabaña", capacity=4, price_per_night=5200, min_nights=None))
    db.add(GlampingAmenity(spot_id=sierra.id, private_bathroom=True, electricity=True, wifi=False,
                           breakfast_included=True, heating=True, parking=True))
    review(sierra, ana, 5, "El domo es increíble de noche.")

    # Trekking
    arequita = spot("Cerro Arequita", 2, "Lavalleja", -34.28, -55.26, is_public=True, public_transport="si")
    db.add(TrekkingDetail(spot_id=arequita.id, bathrooms=True, potable_water=False, pet_friendly=True,
                          kids_friendly=True, parking=True, accessible=False, signal=True))
    db.add(Route(spot_id=arequita.id, name="Sendero a la cima", slug="sendero-a-la-cima", distance_km=4.2,
                 duration_hours=2.5, elevation_gain=180, elevation_loss=180, max_altitude=300, min_altitude=120,
                 difficulty="moderado", route_type="ida y vuelta", technical_level="bajo", physical_demand="medio",
                 description="Sube por el lado del río.\nArriba se ve todo el valle."))
    db.add(Route(spot_id=arequita.id, name="Vuelta a las grutas", slug="vuelta-a-las-grutas", distance_km=2,
                 duration_hours=1, difficulty="fácil", route_type="circular"))
    review(arequita, ana, 4, "La subida es corta pero empinada.")
    cuervos = spot("Quebrada de los Cuervos", 2, "Treinta y Tres", -32.93, -54.46, is_public=True, public_transport="no")
    db.add(TrekkingDetail(spot_id=cuervos.id, bathrooms=False, camping=True, fire_pits=True, signal=False))
    db.add(Route(spot_id=cuervos.id, name="Sendero del Indio", slug="sendero-del-indio", distance_km=6.5,
                 duration_hours=4, difficulty="difícil", route_type="circular"))

    # Escalada
    paredon = spot("Paredón de Arequita", 3, "Lavalleja", -34.27, -55.25, extras=[2])
    norte = ClimbingSector(spot_id=paredon.id, name="Sector Norte", slug="sector-norte", type="deportiva",
                           approach_minutes=15, sun_exposure="sol", rock_type="basalto")
    sur = ClimbingSector(spot_id=paredon.id, name="Sector Sur", slug="sector-sur", type="deportiva",
                         approach_minutes=25, sun_exposure="sombra", rock_type="basalto")
    db.add_all([norte, sur])
    db.flush()
    db.add(ClimbingRoute(sector_id=norte.id, name="La Clásica", grade="5+", type="deportiva", bolts=6, length=18))
    db.add(ClimbingRoute(sector_id=norte.id, name="Techo Negro", grade="6c", type="deportiva", bolts=9, length=22,
                         description="Pasos de techo al principio."))
    db.add(ClimbingRoute(sector_id=sur.id, name="Fisura del Medio", grade="6a", type="tradicional", bolts=0, length=25))

    # Surf
    spot("Playa La Aguada", 4, "Rocha", -34.65, -54.17, is_public=True, description="Playa abierta con olas casi todo el año.")
    escuela = spot("Escuela de Surf La Pedrera", 4, "Rocha", -34.59, -54.12, whatsapp="091222333", price=900)
    db.add(SurfDetail(spot_id=escuela.id, class_type="grupal", duration=1.5, equipment_include=True,
                      levels=["principiante", "intermedio"], languages=["espanol", "ingles"],
                      price_note="por clase", operates_at="Playa del Barco"))

    # Kayak
    spot("Laguna Garzón", 5, "Maldonado", -34.80, -54.57, is_public=True)
    kayak = spot("Kayak Santa Lucía", 5, "Canelones", -34.47, -56.40, whatsapp="094555666", price=1200)
    db.add(KayakServiceDetail(spot_id=kayak.id, water_type="rio", difficulty="facil", duration=3,
                              kayak_type="recreativo", rental_available=True, includes_guide=True,
                              includes_life_jacket=True, price_note="por persona", operates_at="Río Santa Lucía"))

    # Motorhome
    piria = spot("Área Motorhome Piriápolis", 8, "Maldonado", -34.86, -55.27, photos=1)
    db.add(MotorhomeDetail(spot_id=piria.id, capacity=12, surface_type="pasto", has_water=True,
                           has_electricity=True, has_dump_station=False, max_stay_nights=3))

    # De un usuario común: uno publicado y otro esperando que el admin lo apruebe.
    propio = spot("Camping Los Ceibos", 1, "Colonia", -34.40, -57.80, owner=ana, photos=1)
    db.add(CampingDetail(spot_id=propio.id, price=500))
    spot("Camping El Pinar", 1, "Canelones", -34.79, -55.90, owner=ana, approved=False, photos=1)

    db.add(Favorite(user_id=ana, spot_id=laguna.id))
    db.add(Favorite(user_id=ana, spot_id=arequita.id))
    db.commit()
