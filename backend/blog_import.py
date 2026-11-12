"""Cargar o actualizar notas del blog desde archivos JSON, hasta que exista
el editor del admin. Una nota por archivo; si el slug ya existe, se
reemplaza.

    python blog_import.py notas/refugios-frey.json [otra.json ...]

Con DATABASE_URL apuntando a la base (como alembic). El formato está en
blog.py (clean_post). Un lugar de Rumbo se puede nombrar por su slug en vez
del id: {"id": "arequita", "spot": "cerro-arequita"} en un punto del mapa,
{"type": "spot", "spot": "cerro-arequita"} en un bloque.
"""
import json
import sys

from fastapi import HTTPException


def resolve_spot_slugs(db, raw: dict) -> dict:
    """Cambia "spot": "<slug>" por "spot_id": <id>. Un slug que no existe es
    un error (mejor enterarse ahora que ver la nota sin el lugar)."""
    from models import SpotDB

    def spot_id(slug):
        spot = db.query(SpotDB).filter(SpotDB.slug == slug).first()
        if not spot:
            raise HTTPException(status_code=422, detail=f"No hay ningún lugar con el slug «{slug}»")
        return spot.id

    raw = json.loads(json.dumps(raw))  # copia: no tocar lo que llegó
    for container in ((raw.get("map") or {}).get("points") or [], raw.get("blocks") or []):
        for i, item in enumerate(container):
            if isinstance(item, dict) and isinstance(item.get("spot"), str):
                slug = item.pop("spot")
                item["spot_id"] = spot_id(slug)
    return raw


def import_file(db, path: str):
    import blog
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return blog.save_post(db, resolve_spot_slugs(db, raw))


def main(paths: list[str]) -> int:
    from database import SessionLocal
    if not paths:
        print(__doc__)
        return 1
    db = SessionLocal()
    try:
        for path in paths:
            try:
                post = import_file(db, path)
            except HTTPException as e:
                db.rollback()
                print(f"✗ {path}: {e.detail}")
                return 1
            print(f"✓ {path} → /blog/{post.slug} ({post.status})")
        db.commit()
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
