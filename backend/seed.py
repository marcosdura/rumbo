from database import SessionLocal
import models

db = SessionLocal()


# CATEGORÍAS
categories = ["Camping", "Trekking", "Escalada", "Surf", "Kayak"]

category_map = {}

for name in categories:
    cat = db.query(models.Category).filter_by(name=name).first()
    if not cat:
        cat = models.Category(name=name)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    category_map[name] = cat


# AMENITIES
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


# FUNCIONES
def create_surf_school(spot, name, class_type, duration, equipment_include):
    existing = db.query(models.SurfSchool).filter_by(spot_id=spot.id).first()

    if existing:
        return existing

    surf = models.SurfSchool(
        spot_id=spot.id,
        name=name,
        class_type=class_type,
        duration=duration,
        equipment_include=equipment_include
    )

    db.add(surf)
    db.commit()
    db.refresh(surf)

    return surf


def create_spot(name, description, department, category_name, lat=None, lng=None):
    existing = db.query(models.SpotDB).filter_by(name=name).first()
    if existing:
        existing.lat = lat
        existing.lng = lng
        db.commit()
        return existing

    spot = models.SpotDB(
        name=name,
        description=description,
        department=department,
        category_id=category_map[category_name].id,
        lat=lat,
        lng=lng
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


def create_kayak(spot, name, water_type, difficulty, duration, kayak_type, rental_available):
    existing = db.query(models.KayakDetail).filter_by(spot_id=spot.id).first()

    if existing:
        return existing

    kayak = models.KayakDetail(
        spot_id=spot.id,
        name=name,
        water_type=water_type,
        difficulty=difficulty,
        duration=duration,
        kayak_type=kayak_type,
        rental_available=rental_available
    )

    db.add(kayak)
    db.commit()
    db.refresh(kayak)

    return kayak

def add_images_to_spot(spot, public_ids):
    for i, public_id in enumerate(public_ids):
        existing = db.query(models.SpotImage).filter_by(
            spot_id=spot.id,
            cloudinary_public_id=public_id
        ).first()
        if not existing:
            image = models.SpotImage(
                spot_id=spot.id,
                cloudinary_public_id=public_id,
                is_main=(i == 0),
                order=i
            )
            db.add(image)
    db.commit()

STOCK_IMAGES = [
    "photo-1501785888041-af3ef285b470_j1gl7e",
    "photo-1500530855697-b586d89ba3ee_k7j5oo",
    "photo-1441974231531-c6227db76b6e_h8lizq",
    "photo-1507525428034-b723cf961d3e_jzicy6",
    "photo-1470770841072-f978cf4d019e_isvtni",
]


# CAMPING (2)
camp1 = create_spot("Camping Santa Teresa", "Camping icónico cerca del mar", "Rocha", "Camping", lat=-33.9671, lng=-53.5328)

create_camping(camp1, 500)
add_amenities(camp1, ["Ducha", "Baños", "Parrillero", "Playa", "WiFi"])

camp2 = create_spot("Camping Arequita", "Camping en zona serrana", "Lavalleja", "Camping", lat=-34.0203, lng=-55.2847)

create_camping(camp2, 300)
add_amenities(camp2, ["Ducha", "Baños", "Sombra", "Zona para fogón"])


# TREKKING (2)
trek1 = create_spot("Quebrada de los Cuervos", "Reserva natural con senderos", "Treinta y Tres", "Trekking", lat=-32.8961, lng=-54.4203)


create_trekking_route(trek1, "Sendero Principal", "Media", 8)
create_trekking_route(trek1, "Mirador", "Fácil", 3)

trek2 = create_spot("Valle del Lunarejo", "Zona de sierras y biodiversidad", "Rivera", "Trekking", lat=-31.4833, lng=-55.9667)


create_trekking_route(trek2, "Ruta del Valle", "Media", 10)
create_trekking_route(trek2, "Cascadas", "Difícil", 6)


# ESCALADA (1 spot, 2 sectores, 2 rutas c/u)
climb = create_spot("Cerro Arequita", "Principal zona de escalada en Uruguay", "Lavalleja", "Escalada", lat=-34.0150, lng=-55.2900)


sector1 = create_sector(climb, "Placa Sur")
create_climbing_route(sector1, "Fisura Azul", "6a", 8)
create_climbing_route(sector1, "Vertical Loca", "6c", 10)

sector2 = create_sector(climb, "La Cueva")
create_climbing_route(sector2, "Techo Negro", "7a", 12)
create_climbing_route(sector2, "Salida Técnica", "6b", 9)



# KAYAK (2)
kayak1 = create_spot("Laguna Garzón", "Laguna ideal para travesías en kayak con aguas calmas", "Rocha", "Kayak", lat=-34.6167, lng=-54.3500)


create_kayak(
    kayak1,
    name="Travesía Laguna Garzón",
    water_type="lago",
    difficulty="facil",
    duration=2.5,
    kayak_type="travesia",
    rental_available=True
)

add_amenities(kayak1, ["Playa", "Estacionamiento", "Kayak"])

# ------------------------------------

kayak2 = create_spot("Río Santa Lucía", "Tramo tranquilo ideal para kayak recreativo", "Canelones", "Kayak", lat=-34.6500, lng=-56.3833)


create_kayak(
    kayak2,
    name="Recorrido Río Santa Lucía",
    water_type="rio",
    difficulty="intermedio",
    duration=3.0,
    kayak_type="recreativo",
    rental_available=False
)

add_amenities(kayak2, ["Acceso a río/lago/mar", "Sombra", "Zona para fogón"])


surf1 = create_spot("Playa La Paloma", "Una de las playas más populares para el surf en Uruguay, con olas constantes y buena formación para principiantes.", "Rocha", "Surf", lat=-34.6667, lng=-54.1667)


create_surf_school(
    surf1,
    name="La Paloma Surf School",
    class_type="grupal",
    duration=2.0,
    equipment_include=True
)

add_amenities(surf1, ["Playa", "Ducha", "Estacionamiento", "Proveeduría/kiosco"])

# ------------------------------------

surf2 = create_spot("Playa Punta del Diablo", "Punto clásico del surf uruguayo, con olas de mayor potencia ideales para surfistas intermedios y avanzados.", "Rocha", "Surf", lat=-34.0000, lng=-53.5500)


create_surf_school(
    surf2,
    name="Diablo Surf Co.",
    class_type="privada",
    duration=1.5,
    equipment_include=False
)

add_amenities(surf2, ["Playa", "Estacionamiento", "Acepta mascotas", "Cafetería"])


add_images_to_spot(camp1, STOCK_IMAGES)
add_images_to_spot(camp2, STOCK_IMAGES)
add_images_to_spot(trek1, STOCK_IMAGES)
add_images_to_spot(trek2, STOCK_IMAGES)
add_images_to_spot(climb, STOCK_IMAGES)
add_images_to_spot(kayak1, STOCK_IMAGES)
add_images_to_spot(kayak2, STOCK_IMAGES)
add_images_to_spot(surf1, STOCK_IMAGES)
add_images_to_spot(surf2, STOCK_IMAGES)


print("✅ Seed completado")