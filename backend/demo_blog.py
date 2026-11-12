"""Notas de ejemplo del blog para `npm run local` (demo_data.py las carga).
Producción nunca lo importa. Las coordenadas de Argentina son aproximadas:
sirven para ver cómo queda, no para salir a caminar."""
import math

import blog
import blog_import


def _line(stops, per_leg=24):
    """Un recorrido inventado que pasa por `stops` [(lat, lng, altura)], con
    alguna curva para que no sea una recta."""
    points = []
    for (a, b) in zip(stops, stops[1:]):
        for i in range(per_leg):
            t = i / per_leg
            wiggle = math.sin(t * math.pi * 3) * 0.0025
            points.append([
                a[0] + (b[0] - a[0]) * t + wiggle,
                a[1] + (b[1] - a[1]) * t - wiggle,
                round(a[2] + (b[2] - a[2]) * t + math.sin(t * math.pi) * 40),
            ])
    points.append(list(stops[-1]))
    return points


BASE_CATEDRAL = (-41.1690, -71.4400, 1050)
FREY = (-41.1830, -71.4730, 1700)
JAKOB = (-41.1930, -71.5570, 1550)

POSTS = [
    {
        "title": "Travesía de refugios en Bariloche: de Frey a Jakob",
        "summary": "Dos días por el cordón del Catedral durmiendo en refugios de montaña. Qué esperar de cada tramo, cuánta agua llevar y dónde dormir.",
        "cover_image": "rumbo/demo/blog-refugios-bariloche",
        "category": "refugios",
        "region": "Bariloche, Argentina",
        "status": "published",
        "featured": True,
        "map": {
            "points": [
                {"id": "base", "name": "Base Cerro Catedral", "type": "estacionamiento", "lat": BASE_CATEDRAL[0], "lng": BASE_CATEDRAL[1],
                 "note": "Hay colectivo desde el centro de Bariloche."},
                {"id": "frey", "name": "Refugio Frey", "type": "refugio", "lat": FREY[0], "lng": FREY[1],
                 "note": "A orillas de la laguna Toncek.", "image": "rumbo/demo/refugio-frey",
                 "url": "https://www.example.com/refugio-frey"},
                {"id": "toncek", "name": "Laguna Toncek", "type": "agua", "lat": FREY[0] + 0.002, "lng": FREY[1] - 0.004},
                {"id": "jakob", "name": "Refugio San Martín (Jakob)", "type": "refugio", "lat": JAKOB[0], "lng": JAKOB[1],
                 "image": "rumbo/demo/refugio-jakob"},
            ],
            "tracks": [
                {"id": "travesia", "name": "Base Catedral → Frey → Jakob", "points": _line([BASE_CATEDRAL, FREY, JAKOB])},
            ],
        },
        "blocks": [
            {"type": "text", "text": "Es una de las travesías más lindas de la Patagonia y se puede hacer **sin carpa**: se duerme en refugios. Esta guía junta lo que nos hubiera gustado saber antes de ir."},
            {"type": "tip", "tone": "warning", "title": "Antes de salir",
             "text": "Registrá la salida en la oficina de informes del Parque y mirá el pronóstico: arriba del filo el viento cambia rápido."},
            {"type": "heading", "level": 2, "text": "Día 1: de la base al Frey"},
            {"type": "point", "point": "base", "text": "Se arranca por el sendero que sale a la izquierda de los medios de elevación. Los primeros kilómetros son anchos y con poca pendiente."},
            {"type": "point", "point": "frey", "text": "Unas 4 horas de caminata. El refugio tiene cocina y lugar para carpas.\n\n- Reservá cama en temporada alta\n- Hay agua de la laguna (conviene filtrarla)"},
            {"type": "gallery", "images": [
                {"image": "rumbo/demo/frey-laguna-1", "caption": "La laguna Toncek al atardecer"},
                {"image": "rumbo/demo/frey-agujas-2", "caption": "Las agujas del Frey"},
                {"image": "rumbo/demo/frey-refugio-3"},
            ]},
            {"type": "heading", "level": 2, "text": "Día 2: del Frey al Jakob"},
            {"type": "point", "point": "jakob", "text": "El tramo más exigente: se cruza el filo y hay pedreros sueltos. Calculá entre 6 y 8 horas."},
            {"type": "gpx", "track": "travesia"},
            {"type": "video", "url": "https://www.youtube.com/watch?v=aaaaaaaaaaa", "title": "La travesía en 3 minutos"},
            {"type": "video", "url": "https://www.instagram.com/reel/DEMOreel01/", "title": "El amanecer en el Frey"},
            {"type": "checklist", "title": "Qué llevar", "items": [
                "Bolsa de dormir (-5 °C de confort)", "Campera rompevientos", "Frontal con pilas de repuesto",
                "Filtro o pastillas para el agua", "Bastones", "Efectivo para el refugio",
            ]},
        ],
    },
    {
        "title": "Un finde de trekking en Lavalleja",
        "summary": "Cerros, una quebrada y un salto de agua en dos días, con lugares para dormir cerca.",
        "cover_image": "rumbo/demo/blog-lavalleja",
        "category": "rutas",
        "region": "Lavalleja",
        "status": "published",
        "map": {
            "points": [
                {"id": "arequita", "spot": "cerro-arequita", "note": "Subida corta pero empinada."},
                {"id": "paredon", "spot": "paredon-de-arequita"},
                {"id": "penitente", "name": "Salto del Penitente", "type": "mirador", "lat": -34.355, "lng": -55.040},
                {"id": "villa-serrana", "name": "Villa Serrana", "type": "pueblo", "lat": -34.320, "lng": -54.985,
                 "note": "Almacén y algún restorán."},
            ],
            "tracks": [],
        },
        "blocks": [
            {"type": "text", "text": "Lavalleja tiene lo más parecido a la montaña que hay en Uruguay. Con un auto y dos días se pueden juntar varias caminatas cortas."},
            {"type": "heading", "level": 2, "text": "Sábado"},
            {"type": "point", "point": "arequita", "text": "Arrancá temprano: el sol pega fuerte en la subida."},
            {"type": "point", "point": "paredon", "text": "Si escalás, el sector norte tiene vías para todos los niveles."},
            {"type": "heading", "level": 2, "text": "Domingo"},
            {"type": "point", "point": "penitente"},
            {"type": "point", "point": "villa-serrana"},
            {"type": "heading", "level": 3, "text": "Dónde dormir"},
            {"type": "spot", "spot": "glamping-sierra-serena"},
            {"type": "tip", "tone": "tip", "text": "En invierno, llevá abrigo para la noche: en las sierras refresca mucho más que en la costa."},
        ],
    },
    {
        "title": "Qué llevar para acampar por primera vez",
        "summary": "La lista corta de lo que de verdad hace falta, y lo que podés dejar en casa.",
        "cover_image": "rumbo/demo/blog-primer-camping",
        "category": "consejos",
        "status": "published",
        "blocks": [
            {"type": "text", "text": "La primera vez se lleva de más. Esta lista sale de muchas salidas: lo **imprescindible** primero y después lo que suma comodidad.\n\nSi tenés dudas de algo, [buscá un camping](/lugares/camping) con servicios para la primera vez."},
            {"type": "checklist", "title": "Lo imprescindible", "items": [
                "Carpa (probala en casa antes)", "Bolsa de dormir", "Aislante", "Linterna o frontal",
                "Agua y algo para potabilizar", "Botiquín básico",
            ]},
            {"type": "tip", "tone": "tip", "title": "Un truco", "text": "Armá la carpa de día: de noche todo cuesta el doble."},
            {"type": "heading", "level": 2, "text": "Lo que podés dejar en casa"},
            {"type": "text", "text": "- La heladerita gigante\n- Tres mudas de ropa por día\n- Cualquier cosa que no hayas usado en la última salida"},
            {"type": "image", "image": "rumbo/demo/blog-carpa-armada", "caption": "Con poco alcanza", "alt": "Una carpa armada al lado de un fogón"},
        ],
    },
    {
        "title": "Borrador que no se ve",
        "category": "consejos",
        "status": "draft",
        "blocks": [{"type": "text", "text": "Todavía no está publicado."}],
    },
]


def load(db) -> None:
    for raw in POSTS:
        blog.save_post(db, blog_import.resolve_spot_slugs(db, raw))
