from database import SessionLocal
import models

db = SessionLocal()

# -------------------------
# CATEGORÍAS
# -------------------------
categories = ["Camping", "Trekking", "Escalada", "Surf"]

category_map = {}

for name in categories:
    cat = db.query(models.Category).filter_by(name=name).first()
    if not cat:
        cat = models.Category(name=name)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    category_map[name] = cat

# -------------------------
# AMENITIES (igual que antes)
# -------------------------
amenities_list = [
    "Ducha", "Agua caliente", "Baños", "Agua potable", "Electricidad",
    "Lavadero", "Parrillero", "Cocina compartida", "Comedor", "Heladera",
    "Leña disponible", "Sombra", "Mesas y bancos", "Parcelas delimitadas",
    "Acceso a río/lago/mar", "Playa", "Cancha de fútbol", "Cancha de vóley",
    "Piscina", "Alquiler de bicis", "Kayak", "WiFi", "Acepta mascotas",
    "Proveeduría/kiosco", "Cafetería", "Restaurante/bar",
    "Estacionamiento", "Seguridad", "Zona para fogón",
    "Tomas para camper/van", "Área para motorhomes"
]

amenity_map = {}

for name in amenities_list:
    am = db.query(models.Amenity).filter_by(name=name).first()
    if not am:
        am = models.Amenity(name=name)
        db.add(am)
        db.commit()
        db.refresh(am)
    amenity_map[name] = am

# -------------------------
# FUNCIONES
# -------------------------

def create_spot(name, description, department, category_name):
    existing = db.query(models.SpotDB).filter_by(name=name).first()
    if existing:
        return existing

    spot = models.SpotDB(
        name=name,
        description=description,
        department=department,
        category_id=category_map[category_name].id
    )
    db.add(spot)
    db.commit()
    db.refresh(spot)

    return spot


def add_amenities(spot, amenity_names):
    for am_name in amenity_names:
        amenity_id = amenity_map[am_name].id

        existing = db.query(models.SpotAmenity).filter_by(
            spot_id=spot.id,
            amenity_id=amenity_id
        ).first()

        if not existing:
            relation = models.SpotAmenity(
                spot_id=spot.id,
                amenity_id=amenity_id
            )
            db.add(relation)

    db.commit()


def create_camping(spot, price):
    existing = db.query(models.CampingDetail).filter_by(spot_id=spot.id).first()

    if existing:
        return existing

    camping = models.CampingDetail(
        spot_id=spot.id,
        price=price
    )

    db.add(camping)
    db.commit()
    db.refresh(camping)

    return camping


def create_trekking_route(spot, name, difficulty, distance_km):
    route = models.Route(
        spot_id=spot.id,
        name=name,
        difficulty=difficulty,
        distance_km=distance_km
    )
    db.add(route)
    db.commit()


def create_sector(spot, name):
    sector = models.ClimbingSector(
        spot_id=spot.id,
        name=name
    )
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


def create_climbing_route(sector, name, grade, bolts):
    route = models.ClimbingRoute(
        sector_id=sector.id,
        name=name,
        grade=grade,
        bolts=bolts
    )
    db.add(route)
    db.commit()

# -------------------------
# CAMPING (2)
# -------------------------

camp1 = create_spot(
    "Camping Santa Teresa",
    "Camping icónico cerca del mar",
    "Rocha",
    "Camping"
)
create_camping(camp1, 500)
add_amenities(camp1, ["Ducha", "Baños", "Parrillero", "Playa", "WiFi"])

camp2 = create_spot(
    "Camping Arequita",
    "Camping en zona serrana",
    "Lavalleja",
    "Camping"
)
create_camping(camp2, 300)
add_amenities(camp2, ["Ducha", "Baños", "Sombra", "Zona para fogón"])

# -------------------------
# TREKKING (2)
# -------------------------

trek1 = create_spot(
    "Quebrada de los Cuervos",
    "Reserva natural con senderos",
    "Treinta y Tres",
    "Trekking"
)

create_trekking_route(trek1, "Sendero Principal", "Media", 8)
create_trekking_route(trek1, "Mirador", "Fácil", 3)

trek2 = create_spot(
    "Valle del Lunarejo",
    "Zona de sierras y biodiversidad",
    "Rivera",
    "Trekking"
)

create_trekking_route(trek2, "Ruta del Valle", "Media", 10)
create_trekking_route(trek2, "Cascadas", "Difícil", 6)

# -------------------------
# ESCALADA (1 spot, 2 sectores, 2 rutas c/u)
# -------------------------

climb = create_spot(
    "Cerro Arequita",
    "Principal zona de escalada en Uruguay",
    "Lavalleja",
    "Escalada"
)

sector1 = create_sector(climb, "Placa Sur")
create_climbing_route(sector1, "Fisura Azul", "6a", 8)
create_climbing_route(sector1, "Vertical Loca", "6c", 10)

sector2 = create_sector(climb, "La Cueva")
create_climbing_route(sector2, "Techo Negro", "7a", 12)
create_climbing_route(sector2, "Salida Técnica", "6b", 9)

print("✅ Seed completado")