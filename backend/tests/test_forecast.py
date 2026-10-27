"""El pronóstico de un lugar (forecast.py y routers/spot_forecast.py), con
Open-Meteo simulado."""
import httpx
import pytest

import forecast

WEATHER = {"daily": {
    "time": ["2026-10-27", "2026-10-28"],
    "weather_code": [61, 0],
    "temperature_2m_max": [14.6, 21.4],
    "temperature_2m_min": [7.7, 10.2],
    "precipitation_probability_max": [80, 5],
    "wind_speed_10m_max": [16.6, 30.2],
    "wind_direction_10m_dominant": [81, 200],
}}
MARINE = {"daily": {
    "time": ["2026-10-27", "2026-10-28"],
    "wave_height_max": [1.16, None],
    "wave_period_max": [7.65, None],
    "wave_direction_dominant": [153, None],
}}


@pytest.fixture
def meteo(monkeypatch):
    """Cada pedido a Open-Meteo queda anotado; `fail` lo hace fallar."""
    state = {"calls": [], "fail": set()}

    def fake_get(url, params):
        kind = "marine" if url == forecast.MARINE_URL else "weather"
        state["calls"].append((kind, params["latitude"], params["longitude"]))
        if kind in state["fail"]:
            raise httpx.ConnectError("caído")
        return MARINE if kind == "marine" else WEATHER

    forecast.clear_cache()
    monkeypatch.setattr(forecast, "_get", fake_get)
    yield state
    forecast.clear_cache()


def test_el_pronostico_de_un_camping_trae_el_clima_sin_olas(client, make_spot, meteo):
    spot = make_spot(category="Camping", lat=-34.66, lng=-54.16)
    r = client.get(f"/spots/{spot.id}/forecast")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "Open-Meteo.com"
    assert body["days"][0] == {"date": "2026-10-27", "code": 61, "max": 15, "min": 8, "rain": 80, "wind": 17, "wind_dir": 81, "waves": None}
    assert [c[0] for c in meteo["calls"]] == ["weather"]


def test_en_un_lugar_de_surf_trae_las_olas(client, make_spot, meteo):
    spot = make_spot(category="Surf", lat=-34.66, lng=-54.16)
    days = client.get(f"/spots/{spot.id}/forecast").json()["days"]
    assert days[0]["waves"] == {"height": 1.2, "period": 8, "dir": 153}
    # Sin dato de olas ese día (tierra adentro, o el modelo no llega): null.
    assert days[1]["waves"] is None


def test_si_fallan_las_olas_igual_se_ve_el_clima(client, make_spot, meteo):
    meteo["fail"].add("marine")
    spot = make_spot(category="Surf", lat=-34.66, lng=-54.16)
    r = client.get(f"/spots/{spot.id}/forecast")
    assert r.status_code == 200
    assert r.json()["days"][0]["waves"] is None


def test_una_hora_por_lugar_un_solo_pedido(client, make_spot, meteo):
    spot = make_spot(category="Camping", lat=-34.66, lng=-54.16)
    for _ in range(3):
        assert client.get(f"/spots/{spot.id}/forecast").status_code == 200
    assert len(meteo["calls"]) == 1


def test_si_open_meteo_falla_da_503_y_no_insiste_en_cada_visita(client, make_spot, meteo):
    meteo["fail"].add("weather")
    spot = make_spot(category="Camping", lat=-34.66, lng=-54.16)
    assert client.get(f"/spots/{spot.id}/forecast").status_code == 503
    assert client.get(f"/spots/{spot.id}/forecast").status_code == 503
    assert len(meteo["calls"]) == 1


def test_solo_de_lugares_publicados_y_con_ubicacion(client, make_spot, meteo):
    pending = make_spot(name="En revision", approved=False, lat=-34.66, lng=-54.16)
    no_place = make_spot(name="Sin ubicacion")
    assert client.get(f"/spots/{pending.id}/forecast").status_code == 404
    assert client.get(f"/spots/{no_place.id}/forecast").status_code == 404
    assert client.get("/spots/99999/forecast").status_code == 404
    assert meteo["calls"] == []
