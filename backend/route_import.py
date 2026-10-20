"""Importar vías de escalada desde una planilla (solo el admin, desde su
panel). El navegador lee el Excel o el CSV y manda las filas; acá se
validan otra vez y se guardan: una vía con el mismo nombre en el sector
(sin importar mayúsculas ni espacios) se actualiza con los datos que
vienen; una celda vacía no borra lo que ya había."""
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from models import ClimbingRoute, ClimbingSector

MAX_ROWS = 500
# Escala francesa: 3 a 9, letra opcional (a, b, c) y "+" opcional: 6a, 7b+, 5+.
GRADE_PATTERN = r"^[3-9][abc]?\+?$"


class ImportedRoute(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    grade: Optional[str] = Field(default=None, max_length=20, pattern=GRADE_PATTERN)
    type: Optional[Literal["boulder", "deportiva", "tradicional"]] = None
    length: Optional[int] = Field(default=None, ge=1, le=1000)
    bolts: Optional[int] = Field(default=None, ge=0, le=200)
    description: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def _clean_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if not v:
            raise ValueError("El nombre es obligatorio")
        return v


class RouteImport(BaseModel):
    routes: list[ImportedRoute] = Field(min_length=1, max_length=MAX_ROWS)


def _key(name: str) -> str:
    return " ".join(name.split()).casefold()


def import_routes(db: Session, sector: ClimbingSector, rows: list[ImportedRoute]) -> dict:
    """Crea o actualiza (sin commit). Devuelve cuántas de cada una."""
    existing = {
        _key(r.name): r
        for r in db.query(ClimbingRoute).execution_options(include_pending=True).filter(ClimbingRoute.sector_id == sector.id)
        if r.name
    }
    created = updated = 0
    for row in rows:
        data = row.model_dump(exclude={"name"}, exclude_none=True)
        route = existing.get(_key(row.name))
        if route:
            for field, value in data.items():
                setattr(route, field, value)
            updated += 1
        else:
            # Las carga el admin: publicadas de entrada.
            route = ClimbingRoute(sector_id=sector.id, name=row.name, is_approved=True, **data)
            db.add(route)
            existing[_key(row.name)] = route
            created += 1
    return {"created": created, "updated": updated}
