from database import SessionLocal
import models

db = SessionLocal()

# CATEGORÍAS
categories = ["Camping", "Trekking", "Escalada", "Surf", "Kayak", "Glamping"]
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
    "Tomas para camper/van", "Área para motorhomes",
    # Glamping
    "Cama incluida", "Ropa de cama", "Baño privado", "Calefacción", "Aire acondicionado",
    "Desayuno incluido", "Cocina equipada", "Parrilla privada",
    "Terraza / deck", "Vista panorámica", "Fogón privado", "Bañera / jacuzzi",
    "Zona de descanso exterior",
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
        spot_id=spot.id, name=name, class_type=class_type,
        duration=duration, equipment_include=equipment_include
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
        name=name, description=description, department=department,
        category_id=category_map[category_name].id, lat=lat, lng=lng
    )
    db.add(spot)
    db.commit()
    db.refresh(spot)
    return spot


def add_amenities(spot, amenity_names):
    for am_name in amenity_names:
        amenity_id = amenity_map[am_name].id
        existing = db.query(models.SpotAmenity).filter_by(
            spot_id=spot.id, amenity_id=amenity_id
        ).first()
        if not existing:
            db.add(models.SpotAmenity(spot_id=spot.id, amenity_id=amenity_id))
    db.commit()


def create_camping(spot, price):
    existing = db.query(models.CampingDetail).filter_by(spot_id=spot.id).first()
    if existing:
        return existing
    camping = models.CampingDetail(spot_id=spot.id, price=price)
    db.add(camping)
    db.commit()
    db.refresh(camping)
    return camping


def create_trekking_route(spot, name, difficulty, distance_km):
    route = models.Route(
        spot_id=spot.id, name=name, difficulty=difficulty, distance_km=distance_km
    )
    db.add(route)
    db.commit()


def create_sector(spot, name):
    sector = models.ClimbingSector(spot_id=spot.id, name=name)
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


def create_climbing_route(sector, name, grade, bolts):
    route = models.ClimbingRoute(
        sector_id=sector.id, name=name, grade=grade, bolts=bolts
    )
    db.add(route)
    db.commit()


def create_kayak(spot, name, water_type, difficulty, duration, kayak_type, rental_available):
    existing = db.query(models.KayakDetail).filter_by(spot_id=spot.id).first()
    if existing:
        return existing
    kayak = models.KayakDetail(
        spot_id=spot.id, name=name, water_type=water_type, difficulty=difficulty,
        duration=duration, kayak_type=kayak_type, rental_available=rental_available
    )
    db.add(kayak)
    db.commit()
    db.refresh(kayak)
    return kayak


def add_images_to_spot(spot, public_ids):
    for i, public_id in enumerate(public_ids):
        existing = db.query(models.SpotImage).filter_by(
            spot_id=spot.id, cloudinary_public_id=public_id
        ).first()
        if not existing:
            db.add(models.SpotImage(
                spot_id=spot.id, cloudinary_public_id=public_id,
                is_main=(i == 0), order=i
            ))
    db.commit()


# ─────────────────────────────────────────────
# CAMPING
# ─────────────────────────────────────────────

camp1 = create_spot(
    "Camping Santa Teresa",
    "Dentro del Parque Nacional Santa Teresa, a metros de la playa atlántica. "
    "Rodeado de bosques de eucaliptos y pinos centenarios, con acceso directo a la costa "
    "y la Fortaleza de Santa Teresa a pocos pasos. Uno de los campings más grandes y "
    "completos del Uruguay, gestionado por el Ejército Nacional.",
    "Rocha", "Camping",
    lat=-33.98413253333606, lng=-53.54307303682452
)
create_camping(camp1, 450)
add_amenities(camp1, [
    "Ducha", "Agua caliente", "Baños", "Agua potable", "Electricidad",
    "Parrillero", "Zona para fogón", "Mesas y bancos", "Parcelas delimitadas",
    "Playa", "Acceso a río/lago/mar", "Sombra", "Estacionamiento",
    "Acepta mascotas", "Proveeduría/kiosco", "Cancha de fútbol", "Cancha de vóley"
])
add_images_to_spot(camp1, [
    "CampingSantaTeresa1_gnrojs",
    "CampingSantaTeresa2_vx4pml",
    "CampingSantaTeresa3_jwskvb",
    "CampingSantaTeresa4_pevwi9",
    "CampingSantaTeresa5_zmmbic",
])

camp2 = create_spot(
    "Camping Arequita",
    "Al pie del Cerro Arequita y a orillas del Río Santa Lucía, el Camping Municipal "
    "de Lavalleja es uno de los más completos del interior del Uruguay. Con capacidad "
    "para más de 3.000 personas, combina naturaleza serrana, ríos de agua cristalina "
    "y una infraestructura que lo hace ideal para toda la familia. A solo 10 km de la "
    "ciudad de Minas.",
    "Lavalleja", "Camping",
    lat=-34.28430340103899, lng=-55.27792507967903
)
create_camping(camp2, 350)
add_amenities(camp2, [
    "Ducha", "Agua caliente", "Baños", "Agua potable", "Electricidad",
    "Parrillero", "Zona para fogón", "Mesas y bancos", "Parcelas delimitadas",
    "Acceso a río/lago/mar", "Sombra", "Piscina", "Cancha de fútbol",
    "Cancha de vóley", "Estacionamiento", "Seguridad",
    "Área para motorhomes", "Acepta mascotas", "Proveeduría/kiosco"
])
add_images_to_spot(camp2, [
    "CampingArequita1_goj77v",
    "CampingArequita2_owz6d8",
    "CampingArequita3_k6g3xi",
])


# ─────────────────────────────────────────────
# TREKKING
# ─────────────────────────────────────────────

trek1 = create_spot(
    "Quebrada de los Cuervos",
    "Una profunda garganta tallada por el Arroyo Yerbal Chico en las Sierras del Este, "
    "declarada primer Área Protegida del Uruguay. El sendero de 3.250 metros recorre "
    "nueve paradas entre miradores, bosque nativo subtropical y formaciones rocosas únicas. "
    "Hogar de más de 100 especies de aves, incluyendo los buitres cabecirrojos que le dan "
    "nombre al lugar. Un microclima húmedo y selvático que contrasta con el paisaje serrano típico.",
    "Treinta y Tres", "Trekking",
    lat=-32.924619172244874, lng=-54.45863974638528
)
create_trekking_route(trek1, "Circuito de la Quebrada", "Media", 3.25)
create_trekking_route(trek1, "Cañada del Brujo", "Media", 5)
create_trekking_route(trek1, "Cascada de los Olivera", "Fácil", 3)
add_images_to_spot(trek1, [
    "QuebradaDeLosCuervos1_ig4r5t",
    "QuebradaDeLosCuervos2_rfe9fa",
])

trek2 = create_spot(
    "Valle del Lunarejo",
    "En el extremo noroeste de Rivera, cerca de la frontera con Brasil, el Valle del Lunarejo "
    "es uno de los paisajes más remotos y sorprendentes del Uruguay. Quebradas profundas talladas "
    "en roca basáltica, cascadas, cuevas y una vegetación selvática subtropical que no se "
    "encuentra en ningún otro punto del país. Más de 150 especies de aves, coatíes, armadillos "
    "y gatos monteses completan un ecosistema único. Los senderos se recorren con guías locales "
    "baqueanos.",
    "Rivera", "Trekking",
    lat=-31.158278555869583, lng=-55.881465079187954
)
create_trekking_route(trek2, "Cascada del Indio", "Media", 6)
create_trekking_route(trek2, "Puntas del Lunarejo – El Gavilán", "Media", 12)
create_trekking_route(trek2, "Cañón del Laureles", "Fácil", 4)
create_trekking_route(trek2, "Travesía de los Cerros", "Difícil", 18)
add_images_to_spot(trek2, [
    "ValleDelLunarejo1_kksehd",
    "ValleDelLunarejo2_khvlbb",
    "ValleDelLunarejo3_xxoxth",
    "ValleDelLunarejo4_tyzsed",
])


# ─────────────────────────────────────────────
# ESCALADA
# ─────────────────────────────────────────────

climb = create_spot(
    "Cerro Arequita",
    "El Cerro Arequita es la principal zona de escalada deportiva del Uruguay. "
    "Sus paredes de basalto ofrecen más de 40 rutas en distintos sectores, con grados "
    "que van desde el 5c hasta el 7b+. La roca compacta, los techos y las fisuras "
    "características del lugar lo convierten en un destino de referencia para escaladores "
    "de todo el país. A sus pies, el camping municipal y el río hacen del lugar un "
    "destino completo para el fin de semana.",
    "Lavalleja", "Escalada",
    lat=-34.28673514035508, lng=-55.2683762362981
)
sector1 = create_sector(climb, "Placa Sur")
create_climbing_route(sector1, "Fisura Azul", "6a", 8)
create_climbing_route(sector1, "Vertical Loca", "6c", 10)
create_climbing_route(sector1, "La Grieta", "5c", 6)

sector2 = create_sector(climb, "La Cueva")
create_climbing_route(sector2, "Techo Negro", "7a", 12)
create_climbing_route(sector2, "Salida Técnica", "6b", 9)
create_climbing_route(sector2, "El Desplome", "7b", 14)

add_images_to_spot(climb, [
    "CerroArequita1_iubhac",
])


# ─────────────────────────────────────────────
# KAYAK
# ─────────────────────────────────────────────

kayak1 = create_spot(
    "Laguna Garzón",
    "En el límite entre Rocha y Maldonado, la Laguna Garzón es un área protegida de "
    "9.596 hectáreas con aguas calmas ideales para kayak y deportes náuticos sin motor. "
    "El espejo de agua se conecta periódicamente con el Atlántico a través de una barra "
    "de arena, generando un ecosistema único de altísima biodiversidad. Más de 250 especies "
    "de aves, cisnes de cuello negro y flamencos son compañía habitual en el recorrido. "
    "El icónico Puente Circular de Laguna Garzón, inaugurado en 2015, es parte del paisaje.",
    "Rocha", "Kayak",
    lat=-34.77415916494965, lng=-54.561067676903
)
create_kayak(
    kayak1,
    name="Travesía Laguna Garzón",
    water_type="lago",
    difficulty="facil",
    duration=2.5,
    kayak_type="travesia",
    rental_available=True
)
add_amenities(kayak1, ["Playa", "Estacionamiento", "Kayak", "Acceso a río/lago/mar"])
add_images_to_spot(kayak1, [
    "LagunaGarzon1_dkvxzx",
])


# ─────────────────────────────────────────────
# SURF
# ─────────────────────────────────────────────

surf1 = create_spot(
    "Surf Cabo Polonio",
    "Cabo Polonio es el spot de surf más salvaje y auténtico de Uruguay. Rodeado de dunas "
    "imponentes y sin acceso por ruta asfaltada, la Playa Sur (La Calavera) es la única "
    "del litoral uruguayo orientada al este-nordeste, lo que le otorga condiciones únicas "
    "cuando llega el swell del sudeste. Olas para todos los niveles, picos variables y casi "
    "sin gente en el agua. Los lobos marinos de la colonia cercana son los locales del lineup. "
    "Hay escuela de surf con clases individuales y grupales.",
    "Rocha", "Surf",
    lat=-34.40234018046439, lng=-53.78392926811369
)
create_surf_school(
    surf1,
    name="Cabo Polonio Surf School",
    class_type="grupal",
    duration=2.0,
    equipment_include=True
)
add_amenities(surf1, ["Playa", "Estacionamiento", "Acepta mascotas"])
add_images_to_spot(surf1, [
    "SurfCaboPolonio1_svwbv4",
    "SurfCaboPolonio2_kcoudy",
    "SurfCaboPolonio3_xdbw7b",
])

surf2 = create_spot(
    "Surf Playa Santa Teresa",
    "La Moza y las playas vírgenes del Parque Nacional Santa Teresa ofrecen algunas de "
    "las olas más solitarias y de mayor calidad del Uruguay. Con picos variables de izquierda "
    "y derecha, el entorno de bosque de pinos llegando hasta la arena hace que esta sea una "
    "experiencia diferente a cualquier otro spot del país. Ideal para surfistas que buscan "
    "calidad, naturaleza y tranquilidad a la vez.",
    "Rocha", "Surf",
    lat=-33.97202834968614, lng=-53.53086361378421
)
create_surf_school(
    surf2,
    name="Santa Teresa Surf",
    class_type="privada",
    duration=1.5,
    equipment_include=True
)
add_amenities(surf2, ["Playa", "Estacionamiento", "Acepta mascotas", "Ducha"])
add_images_to_spot(surf2, [
    "SurfSantaTeresa1_oldfz0",
])


print("✅ Seed completado")