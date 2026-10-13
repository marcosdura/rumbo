"""Orígenes que pueden llamar a la API desde el navegador."""


def preflight(client, origin):
    return client.options("/spots/ids", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})


def test_el_sitio_puede_llamar_a_la_api(client):
    for origin in ("https://rumboapp.uy", "https://www.rumboapp.uy"):
        assert preflight(client, origin).headers.get("access-control-allow-origin") == origin


def test_otra_app_no(client):
    """rumbo-eight.vercel.app es otra app: estaba en la lista por error."""
    assert "access-control-allow-origin" not in preflight(client, "https://rumbo-eight.vercel.app").headers
