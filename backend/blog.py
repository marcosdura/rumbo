"""El blog: notas armadas con bloques, con un mapa opcional (models.BlogPost).

- clean_post valida una nota entera (lo que manda el editor o un JSON de
  blog_import.py) y devuelve los campos listos para guardar. Nada se guarda
  tal cual llega: cada bloque se rearma con sus campos conocidos.
- El mapa de la nota tiene puntos y recorridos. Un punto es un lugar de
  Rumbo (spot_id) o un punto libre (nombre y coordenadas), para lo que Rumbo
  no tiene: un refugio en Argentina, un mirador, una fuente de agua.
- Los recorridos son GPX ya leídos, como los de las rutas de trekking
  (route_tracks.clean_points y stats), pero sin la regla de pasar cerca de
  un lugar.
- Los videos (YouTube, reels de Instagram) no se incrustan: son tarjetas que
  llevan al video.
"""
import math
import re
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse

from fastapi import HTTPException

import route_tracks
from slugs import generate_slug

CATEGORIES = {"rutas": "Rutas", "refugios": "Refugios", "consejos": "Consejos", "equipo": "Equipo"}
STATUSES = ("draft", "published")
# Qué es un punto libre: define su emoji en el mapa (lib/blog.ts).
POINT_TYPES = ("refugio", "camping", "mirador", "agua", "cima", "estacionamiento", "pueblo", "otro")

MAX_BLOCKS = 200
MAX_POINTS = 60
MAX_TRACKS = 10
MAX_TEXT = 8000
MAX_SHORT = 200
MAX_GALLERY = 20
MAX_CHECKLIST = 60
WORDS_PER_MINUTE = 200

_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
_CLOUDINARY_ID = re.compile(r"^[A-Za-z0-9_\-/.]{1,200}$")
_YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
_INSTAGRAM_ID = re.compile(r"^[A-Za-z0-9_-]{5,40}$")


def _bad(detail: str):
    raise HTTPException(status_code=422, detail=detail)


def _text(value, field: str, *, required=False, max_len=MAX_SHORT) -> str | None:
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            _bad(f"Falta {field}")
        return None
    if not isinstance(value, str):
        _bad(f"{field} tiene que ser texto")
    value = value.strip()
    if len(value) > max_len:
        _bad(f"{field} es demasiado largo (máximo {max_len})")
    return value


def _image(value, field: str) -> str | None:
    if value is None or value == "":
        return None
    if not isinstance(value, str) or not _CLOUDINARY_ID.match(value) or ".." in value:
        _bad(f"{field}: foto inválida")
    return value


def _ident(value, field: str) -> str:
    if not isinstance(value, str) or not _ID.match(value):
        _bad(f"{field}: id inválido (minúsculas, números y guiones)")
    return value


def _number(value, field: str, lo: float, hi: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not lo <= value <= hi:
        _bad(f"{field} inválido")
    return round(float(value), 6)


def _external_url(value, field: str) -> str | None:
    value = _text(value, field, max_len=500)
    if value is None:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        _bad(f"{field}: tiene que ser un link http(s)")
    return value


def youtube_id(url: str) -> str | None:
    """El id de un video de YouTube: watch?v=, youtu.be/, /shorts/, /embed/."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().removeprefix("www.").removeprefix("m.")
    candidate = None
    if host == "youtu.be":
        candidate = parsed.path.strip("/").split("/")[0]
    elif host in ("youtube.com", "music.youtube.com"):
        if parsed.path == "/watch":
            candidate = (parse_qs(parsed.query).get("v") or [None])[0]
        else:
            parts = parsed.path.strip("/").split("/")
            if len(parts) >= 2 and parts[0] in ("shorts", "embed", "live"):
                candidate = parts[1]
    return candidate if candidate and _YOUTUBE_ID.match(candidate) else None


def instagram_id(url: str) -> str | None:
    """El código de un reel o un posteo: instagram.com/reel/<id>, /p/<id>."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().removeprefix("www.")
    if host != "instagram.com":
        return None
    parts = parsed.path.strip("/").split("/")
    # instagram.com/<cuenta>/reel/<id> también existe.
    for i, part in enumerate(parts[:-1]):
        if part in ("reel", "reels", "p") and _INSTAGRAM_ID.match(parts[i + 1]):
            return parts[i + 1]
    return None


# ─── El mapa ────────────────────────────────────────────────────────────────

def _clean_point(raw, i: int) -> dict:
    if not isinstance(raw, dict):
        _bad(f"Punto {i + 1} inválido")
    pid = _ident(raw.get("id"), f"Punto {i + 1}")
    if raw.get("spot_id") is not None:
        spot_id = raw["spot_id"]
        if isinstance(spot_id, bool) or not isinstance(spot_id, int) or spot_id <= 0:
            _bad(f"Punto {i + 1}: spot_id inválido")
        # El nombre es opcional: si está, reemplaza al del lugar en la nota.
        return {"id": pid, "spot_id": spot_id, "note": _text(raw.get("note"), f"Punto {i + 1}: nota", max_len=300)}
    point_type = raw.get("type") or "otro"
    if point_type not in POINT_TYPES:
        _bad(f"Punto {i + 1}: tipo inválido")
    return {
        "id": pid,
        "name": _text(raw.get("name"), f"Punto {i + 1}: nombre", required=True, max_len=80),
        "type": point_type,
        "lat": _number(raw.get("lat"), f"Punto {i + 1}: latitud", -90, 90),
        "lng": _number(raw.get("lng"), f"Punto {i + 1}: longitud", -180, 180),
        "note": _text(raw.get("note"), f"Punto {i + 1}: nota", max_len=300),
        "image": _image(raw.get("image"), f"Punto {i + 1}"),
        "url": _external_url(raw.get("url"), f"Punto {i + 1}: link"),
    }


def _clean_track(raw, i: int) -> dict:
    if not isinstance(raw, dict):
        _bad(f"Recorrido {i + 1} inválido")
    points = route_tracks.clean_points(raw.get("points"))
    return {
        "id": _ident(raw.get("id"), f"Recorrido {i + 1}"),
        "name": _text(raw.get("name"), f"Recorrido {i + 1}: nombre", required=True, max_len=80),
        "points": points,
        # Se calculan acá: no se confía en lo que manda el navegador.
        **route_tracks.stats(points),
    }


def clean_map(raw) -> dict | None:
    if raw is None:
        return None
    if not isinstance(raw, dict):
        _bad("Mapa inválido")
    points, tracks = raw.get("points") or [], raw.get("tracks") or []
    if not isinstance(points, list) or not isinstance(tracks, list):
        _bad("Mapa inválido")
    if len(points) > MAX_POINTS or len(tracks) > MAX_TRACKS:
        _bad(f"El mapa admite hasta {MAX_POINTS} puntos y {MAX_TRACKS} recorridos")
    clean = {
        "points": [_clean_point(p, i) for i, p in enumerate(points)],
        "tracks": [_clean_track(t, i) for i, t in enumerate(tracks)],
    }
    ids = [p["id"] for p in clean["points"]] + [t["id"] for t in clean["tracks"]]
    if len(ids) != len(set(ids)):
        _bad("Hay puntos o recorridos con el mismo id")
    if not ids:
        return None
    return clean


# ─── Los bloques ────────────────────────────────────────────────────────────

def _clean_block(raw, i: int, point_ids: set, track_ids: set) -> dict:
    where = f"Bloque {i + 1}"
    if not isinstance(raw, dict):
        _bad(f"{where} inválido")
    kind = raw.get("type")
    if kind == "heading":
        level = raw.get("level", 2)
        if level not in (2, 3):
            _bad(f"{where}: el título es nivel 2 o 3")
        return {"type": "heading", "level": level, "text": _text(raw.get("text"), f"{where}: texto", required=True, max_len=150)}
    if kind == "text":
        return {"type": "text", "text": _text(raw.get("text"), f"{where}: texto", required=True, max_len=MAX_TEXT)}
    if kind == "image":
        image = _image(raw.get("image"), where)
        if not image:
            _bad(f"{where}: falta la foto")
        return {"type": "image", "image": image, "caption": _text(raw.get("caption"), f"{where}: epígrafe", max_len=300),
                "alt": _text(raw.get("alt"), f"{where}: descripción", max_len=200)}
    if kind == "gallery":
        images = raw.get("images")
        if not isinstance(images, list) or not 1 <= len(images) <= MAX_GALLERY:
            _bad(f"{where}: la galería lleva entre 1 y {MAX_GALLERY} fotos")
        clean = []
        for j, img in enumerate(images):
            if not isinstance(img, dict) or not _image(img.get("image"), f"{where}, foto {j + 1}"):
                _bad(f"{where}, foto {j + 1}: inválida")
            clean.append({"image": img["image"], "caption": _text(img.get("caption"), f"{where}: epígrafe", max_len=300)})
        return {"type": "gallery", "images": clean}
    if kind == "point":
        point = raw.get("point")
        if point not in point_ids:
            _bad(f"{where}: el punto «{point}» no está en el mapa")
        return {"type": "point", "point": point, "text": _text(raw.get("text"), f"{where}: texto", max_len=MAX_TEXT)}
    if kind == "spot":
        spot_id = raw.get("spot_id")
        if isinstance(spot_id, bool) or not isinstance(spot_id, int) or spot_id <= 0:
            _bad(f"{where}: spot_id inválido")
        return {"type": "spot", "spot_id": spot_id}
    if kind == "tip":
        tone = raw.get("tone", "tip")
        if tone not in ("tip", "warning"):
            _bad(f"{where}: tono inválido")
        return {"type": "tip", "tone": tone, "title": _text(raw.get("title"), f"{where}: título", max_len=100),
                "text": _text(raw.get("text"), f"{where}: texto", required=True, max_len=2000)}
    if kind == "checklist":
        items = raw.get("items")
        if not isinstance(items, list) or not 1 <= len(items) <= MAX_CHECKLIST:
            _bad(f"{where}: la lista lleva entre 1 y {MAX_CHECKLIST} cosas")
        return {"type": "checklist", "title": _text(raw.get("title"), f"{where}: título", max_len=100),
                "items": [_text(it, f"{where}, ítem {j + 1}", required=True, max_len=150) for j, it in enumerate(items)]}
    if kind == "video":
        url = _external_url(raw.get("url"), f"{where}: link")
        if not url:
            _bad(f"{where}: falta el link del video")
        if youtube_id(url):
            platform, video_id = "youtube", youtube_id(url)
        elif instagram_id(url):
            platform, video_id = "instagram", instagram_id(url)
        else:
            _bad(f"{where}: tiene que ser un video de YouTube o un reel de Instagram")
        return {"type": "video", "platform": platform, "video_id": video_id, "url": url,
                "title": _text(raw.get("title"), f"{where}: título", required=True, max_len=120),
                "cover": _image(raw.get("cover"), f"{where}: portada")}
    if kind == "gpx":
        track = raw.get("track")
        if track not in track_ids:
            _bad(f"{where}: el recorrido «{track}» no está en el mapa")
        return {"type": "gpx", "track": track}
    _bad(f"{where}: tipo desconocido")


def clean_blocks(raw, map_: dict | None) -> list[dict]:
    if not isinstance(raw, list) or not raw:
        _bad("La nota no tiene contenido")
    if len(raw) > MAX_BLOCKS:
        _bad(f"La nota admite hasta {MAX_BLOCKS} bloques")
    point_ids = {p["id"] for p in (map_ or {}).get("points", [])}
    track_ids = {t["id"] for t in (map_ or {}).get("tracks", [])}
    return [_clean_block(b, i, point_ids, track_ids) for i, b in enumerate(raw)]


def clean_post(raw: dict) -> dict:
    """Los campos de una BlogPost, validados. 422 con el primer problema."""
    if not isinstance(raw, dict):
        _bad("Nota inválida")
    title = _text(raw.get("title"), "el título", required=True, max_len=150)
    slug = generate_slug(raw.get("slug") or title)
    if not slug:
        _bad("Slug inválido")
    category = raw.get("category")
    if category not in CATEGORIES:
        _bad(f"Categoría inválida: {', '.join(CATEGORIES)}")
    status = raw.get("status", "draft")
    if status not in STATUSES:
        _bad("Estado inválido: draft o published")
    map_ = clean_map(raw.get("map"))
    return {
        "slug": slug,
        "title": title,
        "summary": _text(raw.get("summary"), "el resumen", max_len=300),
        "cover_image": _image(raw.get("cover_image"), "Tapa"),
        "category": category,
        "region": _text(raw.get("region"), "la zona", max_len=100),
        "status": status,
        "featured": bool(raw.get("featured", False)),
        "map": map_,
        "blocks": clean_blocks(raw.get("blocks"), map_),
    }


def save_post(db, raw: dict):
    """Crea o actualiza (por slug) una nota. La fecha de publicación queda la
    primera vez que se publica."""
    from models import BlogPost
    data = clean_post(raw)
    post = db.query(BlogPost).filter(BlogPost.slug == data["slug"]).first()
    now = datetime.now(timezone.utc)
    if post is None:
        post = BlogPost(**data)
        db.add(post)
    else:
        for field, value in data.items():
            setattr(post, field, value)
        post.updated_at = now
    if post.status == "published" and post.published_at is None:
        post.published_at = now
    db.flush()
    return post


# ─── Lo que se lee ──────────────────────────────────────────────────────────

def spot_ids(post) -> list[int]:
    """Los lugares de Rumbo que nombra la nota (mapa y tarjetas)."""
    ids = [p["spot_id"] for p in (post.map or {}).get("points", []) if p.get("spot_id")]
    ids += [b["spot_id"] for b in post.blocks if b.get("type") == "spot"]
    return list(dict.fromkeys(ids))


def reading_minutes(post) -> int:
    words = 0
    for b in post.blocks:
        for field in ("text", "title", "caption"):
            if isinstance(b.get(field), str):
                words += len(b[field].split())
        words += sum(len(it.split()) for it in b.get("items", []) if isinstance(it, str))
    return max(1, round(words / WORDS_PER_MINUTE))


def summary(post) -> dict:
    """Lo de la tarjeta en el inicio del blog."""
    map_ = post.map or {}
    return {
        "slug": post.slug,
        "title": post.title,
        "summary": post.summary,
        "cover_image": post.cover_image,
        "category": post.category,
        "region": post.region,
        "featured": post.featured,
        "published_at": post.published_at,
        "updated_at": post.updated_at,
        "reading_minutes": reading_minutes(post),
        "points_count": len(map_.get("points", [])),
        "has_map": bool(map_),
    }
