"""El blog (blog.py, routers/blog.py, blog_import.py)."""
import json

import pytest
from fastapi import HTTPException

import blog
import blog_import
from models import BlogPost


def _post(**fields):
    return {
        "title": "Refugios del sur",
        "category": "refugios",
        "status": "published",
        "blocks": [{"type": "text", "text": "Hola"}],
        **fields,
    }


FREE = {"id": "frey", "name": "Refugio Frey", "type": "refugio", "lat": -41.18, "lng": -71.47}
TRACK = {"id": "ida", "name": "Ida", "points": [[-41.17, -71.44, 1000], [-41.18, -71.47, 1700]]}


def _detail(detail_fn):
    with pytest.raises(HTTPException) as e:
        detail_fn()
    assert e.value.status_code == 422
    return e.value.detail


# ─── Validación ─────────────────────────────────────────────────────────────

def test_clean_post_rearma_los_bloques_con_sus_campos_conocidos():
    data = blog.clean_post(_post(blocks=[
        {"type": "heading", "level": 3, "text": " Día 1 ", "onclick": "alert(1)"},
        {"type": "tip", "text": "Llevá agua"},
    ]))
    assert data["slug"] == "refugios-del-sur"
    assert data["blocks"] == [
        {"type": "heading", "level": 3, "text": "Día 1"},
        {"type": "tip", "tone": "tip", "title": None, "text": "Llevá agua"},
    ]
    assert data["map"] is None


def test_mapa_con_lugar_de_rumbo_punto_libre_y_recorrido():
    data = blog.clean_post(_post(
        map={"points": [{"id": "a", "spot_id": 3}, FREE], "tracks": [TRACK]},
        blocks=[{"type": "point", "point": "frey"}, {"type": "gpx", "track": "ida"}],
    ))
    spot, free = data["map"]["points"]
    assert spot == {"id": "a", "spot_id": 3, "note": None}
    assert (free["name"], free["type"], free["lat"]) == ("Refugio Frey", "refugio", -41.18)
    track = data["map"]["tracks"][0]
    # Distancia y desnivel los calcula el backend: lo que mande el navegador no cuenta.
    assert track["distance_km"] > 2 and track["elevation_gain"] == 700


def test_un_recorrido_puede_estar_lejos_de_cualquier_lugar():
    # A diferencia de route_tracks: el blog cubre lugares que Rumbo no tiene.
    far = {**TRACK, "points": [[10.0, 10.0, None], [10.1, 10.1, None]]}
    assert blog.clean_map({"points": [], "tracks": [far]})["tracks"][0]["distance_km"] > 0


@pytest.mark.parametrize("fields, message", [
    ({"category": "otra"}, "Categoría"),
    ({"status": "listo"}, "Estado"),
    ({"blocks": []}, "contenido"),
    ({"blocks": [{"type": "script"}]}, "tipo desconocido"),
    ({"blocks": [{"type": "point", "point": "nada"}]}, "no está en el mapa"),
    ({"blocks": [{"type": "gpx", "track": "nada"}]}, "no está en el mapa"),
    ({"blocks": [{"type": "image", "image": "../../etc"}]}, "foto inválida"),
    ({"map": {"points": [{**FREE, "lat": 200}]}}, "latitud"),
    ({"map": {"points": [FREE, {**FREE}]}}, "mismo id"),
    ({"map": {"points": [{**FREE, "url": "javascript:alert(1)"}]}}, "http"),
    ({"map": {"points": [{**FREE, "id": "Con Espacios"}]}}, "id inválido"),
    ({"blocks": [{"type": "video", "url": "https://vimeo.com/123", "title": "x"}]}, "YouTube"),
])
def test_clean_post_rechaza(fields, message):
    assert message in _detail(lambda: blog.clean_post(_post(**fields)))


@pytest.mark.parametrize("url, platform, video_id", [
    ("https://www.youtube.com/watch?v=abcdefghijk&t=10", "youtube", "abcdefghijk"),
    ("https://youtu.be/abcdefghijk", "youtube", "abcdefghijk"),
    ("https://m.youtube.com/shorts/abcdefghijk", "youtube", "abcdefghijk"),
    ("https://www.instagram.com/reel/C1a2b3c4d5/", "instagram", "C1a2b3c4d5"),
    ("https://instagram.com/rumbo.app/reel/C1a2b3c4d5", "instagram", "C1a2b3c4d5"),
    ("https://www.instagram.com/p/C1a2b3c4d5/?igsh=xyz", "instagram", "C1a2b3c4d5"),
])
def test_videos_de_youtube_e_instagram(url, platform, video_id):
    block = blog.clean_post(_post(blocks=[{"type": "video", "url": url, "title": "Mirá"}]))["blocks"][0]
    assert (block["platform"], block["video_id"], block["url"]) == (platform, video_id, url)


def test_un_link_falso_de_youtube_no_pasa():
    assert blog.youtube_id("https://youtube.com.evil.com/watch?v=abcdefghijk") is None
    assert blog.instagram_id("https://notinstagram.com/reel/C1a2b3c4d5") is None


# ─── Guardar ────────────────────────────────────────────────────────────────

def test_save_post_crea_y_despues_reemplaza_por_slug(db):
    first = blog.save_post(db, _post(status="draft"))
    db.commit()
    assert first.published_at is None
    blog.save_post(db, _post(summary="Nuevo resumen"))
    db.commit()
    posts = db.query(BlogPost).all()
    assert len(posts) == 1
    assert posts[0].summary == "Nuevo resumen" and posts[0].published_at is not None and posts[0].updated_at is not None


def test_la_fecha_de_publicacion_no_cambia_al_editar(db):
    post = blog.save_post(db, _post())
    db.commit()
    when = post.published_at
    blog.save_post(db, _post(title="Refugios del sur", summary="Otra"))
    db.commit()
    db.refresh(post)
    assert post.published_at == when


# ─── Lectura pública ────────────────────────────────────────────────────────

def test_lista_solo_publicadas_y_de_la_mas_nueva(client, db):
    blog.save_post(db, _post(title="Vieja"))
    db.commit()
    blog.save_post(db, _post(title="Nueva", category="consejos"))
    blog.save_post(db, _post(title="Borrador", status="draft"))
    db.commit()
    res = client.get("/blog/posts")
    assert res.status_code == 200
    assert [p["title"] for p in res.json()] == ["Nueva", "Vieja"]
    assert "blocks" not in res.json()[0]
    assert [p["title"] for p in client.get("/blog/posts", params={"category": "consejos"}).json()] == ["Nueva"]
    assert client.get("/blog/posts", params={"category": "nada"}).status_code == 422


def test_un_borrador_da_404(client, db):
    blog.save_post(db, _post(status="draft"))
    db.commit()
    assert client.get("/blog/posts/refugios-del-sur").status_code == 404
    assert client.get("/blog/posts/no-existe").status_code == 404


def test_la_nota_trae_sus_lugares_y_saca_los_que_no_estan_publicados(client, db, make_spot):
    visible = make_spot(name="Cerro Arequita", category="Trekking", lat=-34.28, lng=-55.26)
    oculto = make_spot(name="Oculto", approved=False)
    blog.save_post(db, _post(
        map={"points": [{"id": "a", "spot_id": visible.id}, {"id": "b", "spot_id": oculto.id}, FREE], "tracks": []},
        blocks=[
            {"type": "point", "point": "a"}, {"type": "point", "point": "b"}, {"type": "point", "point": "frey"},
            {"type": "spot", "spot_id": oculto.id}, {"type": "text", "text": "Fin"},
        ],
    ))
    db.commit()
    data = client.get("/blog/posts/refugios-del-sur").json()
    assert [p["id"] for p in data["map"]["points"]] == ["a", "frey"]
    assert [b.get("point") or b["type"] for b in data["blocks"]] == ["a", "frey", "text"]
    spot = data["spots"][str(visible.id)]
    assert (spot["name"], spot["slug"], spot["lat"]) == ("Cerro Arequita", "cerro-arequita", -34.28)
    # Como en los listados: nada de datos de personas.
    assert "owner_email" not in spot
    assert data["points_count"] == 3 and data["reading_minutes"] == 1


def test_relacionadas_de_la_misma_categoria(client, db):
    for title, category in [("Uno", "refugios"), ("Dos", "refugios"), ("Tres", "consejos")]:
        blog.save_post(db, _post(title=title, category=category))
    db.commit()
    assert [p["title"] for p in client.get("/blog/posts/uno").json()["related"]] == ["Dos"]


# ─── blog_import ────────────────────────────────────────────────────────────

def test_importar_nombrando_lugares_por_slug(db, make_spot, tmp_path):
    spot = make_spot(name="Cerro Arequita")
    path = tmp_path / "nota.json"
    path.write_text(json.dumps(_post(
        map={"points": [{"id": "a", "spot": "cerro-arequita"}]},
        blocks=[{"type": "point", "point": "a"}, {"type": "spot", "spot": "cerro-arequita"}],
    )), encoding="utf-8")
    post = blog_import.import_file(db, str(path))
    assert post.map["points"][0]["spot_id"] == spot.id
    assert post.blocks[1] == {"type": "spot", "spot_id": spot.id}


def test_importar_con_un_slug_que_no_existe_avisa(db):
    raw = _post(blocks=[{"type": "spot", "spot": "no-existe"}])
    assert "no-existe" in _detail(lambda: blog_import.resolve_spot_slugs(db, raw))


# ─── El editor (admin) ──────────────────────────────────────────────────────

from conftest import ADMIN, as_user  # noqa: E402

ADMIN_H = as_user(ADMIN)


def test_el_editor_es_solo_del_admin(client):
    assert client.get("/admin/blog/posts").status_code == 401
    assert client.get("/admin/blog/posts", headers=as_user("otro@test.com")).status_code == 403
    assert client.post("/admin/blog/posts", json=_post(), headers=as_user("otro@test.com")).status_code == 403
    assert client.post("/admin/blog/preview", json=_post(), headers=as_user("otro@test.com")).status_code == 403
    assert client.get("/admin/blog/can-upload", headers=as_user("otro@test.com")).status_code == 403
    assert client.get("/admin/blog/can-upload", headers=ADMIN_H).status_code == 204


def test_crear_editar_y_borrar_una_nota(client, db):
    res = client.post("/admin/blog/posts", json=_post(status="draft"), headers=ADMIN_H)
    assert res.status_code == 201
    post = res.json()
    assert (post["slug"], post["status"], post["published_at"]) == ("refugios-del-sur", "draft", None)
    # El borrador está en la lista del admin pero no en la pública.
    assert [p["title"] for p in client.get("/admin/blog/posts", headers=ADMIN_H).json()] == ["Refugios del sur"]
    assert client.get("/blog/posts").json() == []

    res = client.put(f"/admin/blog/posts/{post['id']}", json=_post(slug="otro-link", status="published"), headers=ADMIN_H)
    assert res.status_code == 200
    assert res.json()["slug"] == "otro-link" and res.json()["published_at"]
    assert client.get("/blog/posts/otro-link").status_code == 200

    assert client.delete(f"/admin/blog/posts/{post['id']}", headers=ADMIN_H).status_code == 204
    assert client.get(f"/admin/blog/posts/{post['id']}", headers=ADMIN_H).status_code == 404
    assert db.query(BlogPost).count() == 0


def test_dos_notas_no_pueden_tener_el_mismo_link(client):
    first = client.post("/admin/blog/posts", json=_post(), headers=ADMIN_H).json()
    assert client.post("/admin/blog/posts", json=_post(), headers=ADMIN_H).status_code == 409
    other = client.post("/admin/blog/posts", json=_post(title="Otra"), headers=ADMIN_H).json()
    res = client.put(f"/admin/blog/posts/{other['id']}", json=_post(title="Otra", slug=first["slug"]), headers=ADMIN_H)
    assert res.status_code == 409
    # Guardar la misma nota con su propio link no choca.
    assert client.put(f"/admin/blog/posts/{first['id']}", json=_post(), headers=ADMIN_H).status_code == 200


def test_un_error_de_validacion_dice_que_falta(client):
    res = client.post("/admin/blog/posts", json=_post(blocks=[{"type": "point", "point": "nada"}]), headers=ADMIN_H)
    assert res.status_code == 422
    assert "nada" in res.json()["detail"]


def test_para_editar_trae_los_nombres_de_sus_lugares(client, make_spot):
    visible = make_spot(name="Cerro Arequita")
    oculto = make_spot(name="Oculto", approved=False)
    raw = _post(map={"points": [{"id": "a", "spot_id": visible.id}, {"id": "b", "spot_id": oculto.id}]})
    post = client.post("/admin/blog/posts", json=raw, headers=ADMIN_H).json()
    data = client.get(f"/admin/blog/posts/{post['id']}", headers=ADMIN_H).json()
    assert len(data["map"]["points"]) == 2
    assert data["spots"][str(visible.id)]["name"] == "Cerro Arequita"
    assert data["spots"][str(visible.id)]["available"] is True
    assert data["spots"][str(oculto.id)]["available"] is False


def test_la_vista_previa_valida_sin_guardar(client, db, make_spot):
    visible = make_spot(name="Cerro Arequita")
    raw = _post(
        map={"points": [{"id": "a", "spot_id": visible.id}, {"id": "b", "spot_id": 9999}, FREE], "tracks": [TRACK]},
        blocks=[{"type": "point", "point": "b"}, {"type": "gpx", "track": "ida"}],
    )
    res = client.post("/admin/blog/preview", json=raw, headers=ADMIN_H)
    assert res.status_code == 200
    data = res.json()
    assert db.query(BlogPost).count() == 0
    assert [p["id"] for p in data["map"]["points"]] == ["a", "frey"]
    assert data["missing_spots"] == [9999]
    # El bloque del lugar que no se ve se saca, como en la nota publicada.
    assert data["blocks"] == [{"type": "gpx", "track": "ida"}]
    assert data["map"]["tracks"][0]["elevation_gain"] == 700
    assert client.post("/admin/blog/preview", json=_post(category="nada"), headers=ADMIN_H).status_code == 422


# ─── Fase 4: guías del lugar y guardar todos ────────────────────────────────

def test_las_guias_de_un_lugar(client, db, make_spot):
    arequita = make_spot(name="Cerro Arequita")
    otro = make_spot(name="Otro")
    blog.save_post(db, _post(title="En el mapa", map={"points": [{"id": "a", "spot_id": arequita.id}]}))
    blog.save_post(db, _post(title="En una tarjeta", blocks=[{"type": "spot", "spot_id": arequita.id}]))
    blog.save_post(db, _post(title="Borrador", status="draft", blocks=[{"type": "spot", "spot_id": arequita.id}]))
    blog.save_post(db, _post(title="De otro", blocks=[{"type": "spot", "spot_id": otro.id}]))
    db.commit()
    found = client.get("/blog/posts", params={"spot": arequita.id}).json()
    assert sorted(p["title"] for p in found) == ["En el mapa", "En una tarjeta"]


def test_guardar_todos_los_lugares_de_una_nota(client, db, make_spot):
    from models import Favorite
    a, b = make_spot(name="Uno"), make_spot(name="Dos")
    oculto = make_spot(name="Oculto", approved=False)
    me = as_user("ana@test.com")
    assert client.post(f"/favorites/{a.id}", headers=me).status_code == 201

    res = client.post("/favorites/bulk", json={"spot_ids": [a.id, b.id, oculto.id, 9999]}, headers=me)
    assert res.status_code == 200
    assert res.json() == {"added": 1, "saved": 2}
    assert {f.spot_id for f in db.query(Favorite).all()} == {a.id, b.id}
    # Otra vez: nada nuevo, sin error.
    assert client.post("/favorites/bulk", json={"spot_ids": [a.id, b.id]}, headers=me).json() == {"added": 0, "saved": 2}


def test_guardar_todos_pide_sesion_y_una_lista(client):
    assert client.post("/favorites/bulk", json={"spot_ids": [1]}).status_code == 401
    me = as_user("ana@test.com")
    assert client.post("/favorites/bulk", json={"spot_ids": []}, headers=me).status_code == 422
    assert client.post("/favorites/bulk", json={"spot_ids": ["1"]}, headers=me).status_code == 422
    assert client.post("/favorites/bulk", json={"spot_ids": list(range(1, 62))}, headers=me).status_code == 422
