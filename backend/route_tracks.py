"""El recorrido de una ruta de trekking (models.RouteTrack), de un GPX.

- El GPX se lee en el navegador y llega como puntos [[lat, lng, altura]],
  ya simplificado. Acá se valida (cantidad, coordenadas, que esté cerca del
  lugar) y se calculan distancia y desnivel: no se confía en lo que mande
  el navegador.
- Lo sube cualquier usuario logueado a una ruta publicada; pasa por revisión
  del admin (salvo el admin), como un aporte. Uno por ruta (contando el que
  está en revisión).
- Al aprobarse, lo que la ruta no tenía cargado (distancia, desnivel) sale
  del recorrido; lo que ya estaba no se pisa.
"""
import math

from fastapi import HTTPException
from sqlalchemy.orm import Session

from auth import is_admin
import contributions
from models import Route, RouteTrack

MIN_POINTS = 2
MAX_POINTS = 1500
# El recorrido tiene que empezar o pasar cerca del lugar.
MAX_KM_FROM_SPOT = 30.0
# Para no contar el ruido del GPS como desnivel.
ELEVATION_NOISE_M = 3


def _km(a, b) -> float:
    r = 6371.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = math.radians(b[0] - a[0]), math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def clean_points(raw) -> list[list]:
    """[[lat, lng, altura|None]] válidos, o 422."""
    if not isinstance(raw, list) or not (MIN_POINTS <= len(raw) <= MAX_POINTS):
        raise HTTPException(status_code=422, detail=f"El recorrido tiene que tener entre {MIN_POINTS} y {MAX_POINTS} puntos.")
    points = []
    for p in raw:
        if not isinstance(p, (list, tuple)) or len(p) not in (2, 3):
            raise HTTPException(status_code=422, detail="Punto inválido")
        lat, lng = p[0], p[1]
        ele = p[2] if len(p) == 3 else None
        if not all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in (lat, lng)):
            raise HTTPException(status_code=422, detail="Punto inválido")
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise HTTPException(status_code=422, detail="Punto inválido")
        if ele is not None and (isinstance(ele, bool) or not isinstance(ele, (int, float)) or not (-500 <= ele <= 9000)):
            ele = None
        points.append([round(float(lat), 6), round(float(lng), 6), round(float(ele), 1) if ele is not None else None])
    return points


def stats(points) -> dict:
    distance = sum(_km(points[i - 1], points[i]) for i in range(1, len(points)))
    gain = loss = 0.0
    last = None
    for p in points:
        ele = p[2]
        if ele is None:
            continue
        if last is not None:
            diff = ele - last
            if abs(diff) < ELEVATION_NOISE_M:
                continue
            if diff > 0:
                gain += diff
            else:
                loss -= diff
        last = ele
    has_elevation = any(p[2] is not None for p in points)
    return {
        "distance_km": round(distance, 2),
        "elevation_gain": round(gain) if has_elevation else None,
        "elevation_loss": round(loss) if has_elevation else None,
    }


def get_route(db: Session, route_id: int) -> Route:
    route = db.query(Route).filter(Route.id == route_id).first()
    spot = route.spot if route else None
    if not route or not spot or not spot.is_approved or spot.owner_deleted_at is not None:
        raise HTTPException(status_code=404, detail="No encontrado")
    return route


def existing_track(db: Session, route_id: int):
    """El de la ruta, publicado o en revisión."""
    return db.query(RouteTrack).execution_options(include_pending=True).filter(RouteTrack.route_id == route_id).first()


def add_track(db: Session, route_id: int, raw_points, user: dict) -> RouteTrack:
    route = get_route(db, route_id)
    spot = route.spot
    if existing_track(db, route_id):
        raise HTTPException(status_code=409, detail="Esta ruta ya tiene un recorrido (o hay uno en revisión).")
    points = clean_points(raw_points)
    if spot.lat is not None and spot.lng is not None:
        near = min(_km((spot.lat, spot.lng), p) for p in points)
        if near > MAX_KM_FROM_SPOT:
            raise HTTPException(status_code=422, detail="El recorrido no pasa cerca de este lugar. ¿Es el archivo correcto?")
    track = RouteTrack(route_id=route.id, spot_id=spot.id, points=points, uploaded_by=user.get("email"), **stats(points))
    db.add(track)
    db.flush()
    contributions.register(db, "track", track, spot, user, pending=not is_admin(user))
    if track.is_approved:
        fill_route_from_track(track)
    return track


def fill_route_from_track(track: RouteTrack):
    route = track.route
    for field in ("distance_km", "elevation_gain", "elevation_loss"):
        if getattr(route, field) is None and getattr(track, field) is not None:
            setattr(route, field, getattr(track, field))


def public_track(db: Session, route_id: int):
    """El publicado (o None) y si hay uno en revisión."""
    track = existing_track(db, route_id)
    if track is None:
        return None, False
    if not track.is_approved:
        return None, True
    return {
        "points": track.points,
        "distance_km": track.distance_km,
        "elevation_gain": track.elevation_gain,
        "elevation_loss": track.elevation_loss,
    }, False


def delete_for_route(db: Session, route_id: int, by: str):
    """Al borrar la ruta: su recorrido (también en revisión) y su aporte."""
    track = existing_track(db, route_id)
    if track:
        contributions.withdraw_for_deleted_item(db, "track", track.id, by)
        db.delete(track)
