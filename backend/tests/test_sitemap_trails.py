"""GET /sitemap/trails: rutas y sectores publicados para el sitemap."""
from models import ClimbingSector, Route


def test_rutas_y_sectores_de_lugares_publicados(client, db, make_spot):
    cerro = make_spot(name="Cerro", slug="cerro")
    roca = make_spot(name="Roca", slug="roca")
    oculto = make_spot(name="Oculto", slug="oculto", approved=False)
    db.add_all([
        Route(spot_id=cerro.id, name="Cumbre", slug="cumbre"),
        Route(spot_id=cerro.id, name="Sin slug", slug=None),
        Route(spot_id=cerro.id, name="En revision", slug="en-revision", is_approved=False),
        Route(spot_id=oculto.id, name="Del oculto", slug="del-oculto"),
        ClimbingSector(spot_id=roca.id, name="Norte", slug="norte"),
    ])
    db.commit()
    r = client.get("/sitemap/trails")
    assert r.status_code == 200
    assert r.json() == [
        {"kind": "rutas", "spot_slug": "cerro", "slug": "cumbre"},
        {"kind": "sectores", "spot_slug": "roca", "slug": "norte"},
    ]
