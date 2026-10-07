"""GET /spots/nearby: lugares publicados cerca de un punto (agregar-lugar
avisa de posibles duplicados al marcar la ubicación)."""
from routers.spots import distance_km


def test_distancia_haversine():
    # Un grado de latitud son ~111 km.
    assert round(distance_km(-34.0, -55.0, -35.0, -55.0)) == 111


def test_devuelve_los_publicados_a_menos_de_un_km_ordenados(client, make_spot):
    make_spot(name="Camping del Arroyo", lat=-34.5000, lng=-55.0000)
    make_spot(name="Cabañas del Lago", lat=-34.5050, lng=-55.0000)    # ~556 m
    make_spot(name="Lejos", lat=-34.6000, lng=-55.0000)               # ~11 km
    r = client.get("/spots/nearby", params={"lat": -34.5001, "lng": -55.0})
    assert [s["name"] for s in r.json()] == ["Camping del Arroyo", "Cabañas del Lago"]
    assert r.json()[0]["distance_m"] < 20
    assert r.json()[0]["category"] == "Camping"


def test_no_muestra_los_pendientes_ni_los_sin_ubicacion(client, make_spot):
    make_spot(name="Pendiente", approved=False, lat=-34.5, lng=-55.0)
    make_spot(name="Sin ubicacion")
    assert client.get("/spots/nearby", params={"lat": -34.5, "lng": -55.0}).json() == []
