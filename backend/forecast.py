"""El pronóstico de los próximos días en un lugar, de Open-Meteo.

- Clima (todos los lugares): estado, máxima y mínima, probabilidad de
  lluvia y viento.
- Olas (lugares de surf): altura, período y dirección (API marina; tierra
  adentro devuelve null y no se muestran).

Open-Meteo es gratis y sin clave solo para uso no comercial, y pide citar
la fuente (CC BY 4.0: "Datos del clima: Open-Meteo.com"). Si Rumbo pasa a
ser comercial hay que pasar a su plan pago o cambiar de proveedor.

Se guarda una hora por lugar (en memoria): muchas visitas al mismo lugar
hacen un solo pedido. Si Open-Meteo falla, se recuerda unos minutos para no
insistir en cada visita.
"""
import threading
import time

import httpx

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
DAYS = 5
TTL = 3600
FAILED_TTL = 300
TIMEOUT = 6

_cache: dict[tuple, tuple[float, dict | None]] = {}
_lock = threading.Lock()


class ForecastUnavailable(Exception):
    pass


def _get(url: str, params: dict) -> dict:
    r = httpx.get(url, params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def _round(v, digits=0):
    return None if v is None else (round(v) if digits == 0 else round(v, digits))


def _fetch(lat: float, lng: float, marine: bool) -> dict:
    common = {"latitude": lat, "longitude": lng, "timezone": "America/Montevideo", "forecast_days": DAYS}
    w = _get(FORECAST_URL, {**common, "daily": ",".join([
        "weather_code", "temperature_2m_max", "temperature_2m_min",
        "precipitation_probability_max", "wind_speed_10m_max", "wind_direction_10m_dominant",
    ])})["daily"]
    waves = None
    if marine:
        try:
            waves = _get(MARINE_URL, {**common, "daily": "wave_height_max,wave_period_max,wave_direction_dominant"})["daily"]
        except (httpx.HTTPError, KeyError, ValueError):
            waves = None  # sin olas, el clima igual sirve
    days = []
    for i, date in enumerate(w["time"]):
        day = {
            "date": date,
            "code": w["weather_code"][i],
            "max": _round(w["temperature_2m_max"][i]),
            "min": _round(w["temperature_2m_min"][i]),
            "rain": w["precipitation_probability_max"][i],
            "wind": _round(w["wind_speed_10m_max"][i]),
            "wind_dir": w["wind_direction_10m_dominant"][i],
            "waves": None,
        }
        if waves and i < len(waves.get("time", [])) and waves["wave_height_max"][i] is not None:
            day["waves"] = {
                "height": _round(waves["wave_height_max"][i], 1),
                "period": _round(waves["wave_period_max"][i]),
                "dir": waves["wave_direction_dominant"][i],
            }
        days.append(day)
    return {"days": days, "source": "Open-Meteo.com"}


def forecast_for(lat: float, lng: float, marine: bool) -> dict:
    # Mismo lugar redondeado a ~1 km: los pronósticos no distinguen menos.
    key = (round(lat, 2), round(lng, 2), marine)
    now = time.time()
    with _lock:
        hit = _cache.get(key)
    if hit and hit[0] > now:
        if hit[1] is None:
            raise ForecastUnavailable()
        return hit[1]
    try:
        data = _fetch(lat, lng, marine)
    except (httpx.HTTPError, KeyError, ValueError, TypeError, IndexError) as e:
        with _lock:
            _cache[key] = (now + FAILED_TTL, None)
        raise ForecastUnavailable() from e
    with _lock:
        _cache[key] = (now + TTL, data)
    return data


def clear_cache():
    with _lock:
        _cache.clear()
