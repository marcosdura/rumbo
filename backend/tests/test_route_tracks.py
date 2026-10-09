"""Recorrido (GPX) de una ruta de trekking (route_tracks.py)."""
import pytest

from conftest import ADMIN, OTHER, as_user, every
from models import Contribution, Route, RouteTrack

LAT, LNG = -34.3, -55.2


def line(n=10, step=0.001, ele0=100.0, ele_step=10.0):
    """Hacia el norte: 0.001° de latitud son ~111 m."""
    return [[LAT + i * step, LNG, ele0 + i * ele_step] for i in range(n)]


@pytest.fixture
def route(db, make_spot):
    spot = make_spot(name="Cerro", category="Trekking", slug="cerro", lat=LAT, lng=LNG)
    r = Route(spot_id=spot.id, name="Cumbre", slug="cumbre", distance_km=None, elevation_gain=450)
    db.add(r)
    db.commit()
    return r


def send(client, route, points, user=OTHER):
    return client.post(f"/routes/{route.id}/track", json={"points": points}, headers=as_user(user))


def test_cualquiera_sube_y_queda_en_revision(client, db, route):
    r = send(client, route, line())
    assert r.status_code == 200, r.text
    assert r.json() == {"pending": True, "distance_km": pytest.approx(1.0, abs=0.01)}
    page = client.get("/routes/page/cerro/cumbre").json()["route"]
    assert (page["track"], page["track_pending"]) == (None, True)
    assert db.query(Contribution).filter_by(kind="track").one().title == "Recorrido de «Cumbre»"


def test_el_backend_calcula_distancia_y_desnivel_sin_contar_el_ruido(client, db, route):
    points = line(n=4, ele_step=10) + [[LAT + 0.004, LNG, 131.0], [LAT + 0.005, LNG, 100.0]]
    send(client, route, points, user=ADMIN)
    track = every(db, RouteTrack).one()
    # +30 en la subida; el +1 (ruido) no cuenta, así que la bajada es desde 130: 30.
    assert (track.elevation_gain, track.elevation_loss) == (30, 30)


def test_aprobado_completa_lo_que_la_ruta_no_tenia_sin_pisar_lo_cargado(client, db, route):
    send(client, route, line())
    contribution = db.query(Contribution).filter_by(kind="track").one()
    client.post(f"/admin/contributions/{contribution.id}/approve", headers=as_user(ADMIN))
    db.expire_all()
    r = every(db, Route).filter_by(id=route.id).one()
    assert r.distance_km == pytest.approx(1.0, abs=0.01)
    assert r.elevation_gain == 450
    page = client.get("/routes/page/cerro/cumbre").json()["route"]
    assert len(page["track"]["points"]) == 10 and page["track_pending"] is False


def test_el_admin_lo_publica_directo(client, route):
    assert send(client, route, line(), user=ADMIN).json()["pending"] is False
    assert client.get("/routes/page/cerro/cumbre").json()["route"]["track"] is not None


def test_uno_por_ruta_contando_el_en_revision(client, route):
    send(client, route, line())
    assert send(client, route, line()).status_code == 409


def test_tiene_que_pasar_cerca_del_lugar(client, route):
    lejos = [[-30.0 + i * 0.001, -57.0, None] for i in range(5)]
    assert send(client, route, lejos).status_code == 422


def test_puntos_invalidos(client, route):
    assert send(client, route, [[LAT, LNG]]).status_code == 422
    assert send(client, route, [[LAT, LNG], ["a", LNG]]).status_code == 422
    assert send(client, route, [[LAT, LNG], [95, LNG]]).status_code == 422
    assert send(client, route, [[LAT, LNG, None]] * 1501).status_code == 422


def test_sin_sesion_no(client, route):
    assert client.post(f"/routes/{route.id}/track", json={"points": line()}).status_code == 401


def test_rechazar_lo_borra(client, db, route):
    send(client, route, line())
    contribution = db.query(Contribution).filter_by(kind="track").one()
    client.post(f"/admin/contributions/{contribution.id}/reject", json={"reason": "No es esta ruta"}, headers=as_user(ADMIN))
    assert every(db, RouteTrack).count() == 0
    item = client.get("/routes/page/cerro/cumbre").json()["route"]
    assert (item["track"], item["track_pending"]) == (None, False)


def test_el_admin_ve_el_resumen(client, route):
    send(client, route, line())
    [c] = client.get("/admin/contributions", headers=as_user(ADMIN)).json()
    assert c["item"]["target_name"] == "Cumbre" and c["item"]["points_count"] == 10


def test_borrar_la_ruta_borra_el_recorrido_y_cierra_el_aporte(client, db, route):
    send(client, route, line())
    assert client.delete(f"/routes/{route.id}", headers=as_user(ADMIN)).status_code == 200
    assert every(db, RouteTrack).count() == 0
    assert db.query(Contribution).filter_by(kind="track").one().status == "withdrawn"
