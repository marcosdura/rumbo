"""Los datos de ejemplo de `npm run local` (demo_data.py): que la API los
sirva sin errores, así el sitio local abre con todo."""
import demo_data
from models import SpotDB
from tests.conftest import ADMIN

ANA, PEDRO = "ana@rumbo.local", "pedro@rumbo.local"


def test_la_api_sirve_todos_los_lugares_de_ejemplo(client, db):
    demo_data.load(db, ADMIN, [ANA, PEDRO], ["Ducha", "Baños", "Parrillero"])
    spots = db.query(SpotDB).all()
    published = [s for s in spots if s.is_approved]
    assert {s.category_id for s in published} == set(demo_data.CATEGORIES)
    assert len({s.department for s in published}) >= 7

    res = client.get("/spots", params={"limit": 100})
    assert res.status_code == 200
    assert len(res.json()) == len(published)
    for s in published:
        assert client.get(f"/spots/by-slug/{s.slug}").status_code == 200, s.slug
    assert client.get("/home").status_code == 200


def test_rutas_sectores_glamping_y_lo_de_cada_usuario(client, db):
    demo_data.load(db, ADMIN, [ANA, PEDRO], [])
    route = client.get("/routes/page/cerro-arequita/sendero-a-la-cima")
    assert route.status_code == 200
    sector = client.get("/sectors/page/paredon-de-arequita/sector-norte")
    assert sector.status_code == 200
    glamping = client.get("/spots/by-slug/glamping-sierra-serena").json()
    assert [u["price_per_night"] for u in glamping["glamping_detail"]] == [3500, 5200]

    # Ana: sus favoritos y su lugar pendiente, que el admin ve para aprobar.
    assert len(client.get("/favorites", headers={"X-User": ANA}).json()) == 2
    admin_list = client.get("/admin/spots", headers={"X-User": ADMIN}).json()
    assert [s["name"] for s in admin_list if not s["is_approved"]] == ["Camping El Pinar"]


def test_notas_del_blog_de_ejemplo(client, db):
    demo_data.load(db, ADMIN, [ANA, PEDRO], [])
    posts = client.get("/blog/posts").json()
    # El borrador no sale.
    assert len(posts) == 3 and posts[0]["featured"] in (True, False)
    for p in posts:
        assert client.get(f"/blog/posts/{p['slug']}").status_code == 200, p["slug"]
    lavalleja = client.get("/blog/posts/un-finde-de-trekking-en-lavalleja").json()
    # Lugares de Rumbo y puntos libres en el mismo mapa.
    kinds = {"spot" if p.get("spot_id") else "libre" for p in lavalleja["map"]["points"]}
    assert kinds == {"spot", "libre"} and len(lavalleja["spots"]) == 3
