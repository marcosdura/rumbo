"""Escuelas de surf y servicios de kayak ("operadores").

Cada uno es casi un lugar propio (nombre, contacto, fotos, reseñas, página
pública) que trabaja dentro de una playa o laguna. La playa es un lugar
público que, aprobado, maneja el admin (ownership.is_public_venue); la
escuela tiene su propio dueño: quien la sumó.

- Sumar una escuela a una playa: cualquier usuario logueado, siempre con
  revisión (salvo el admin). Pasa a ser su dueño.
- Manejarla (editar, borrar): su dueño o el admin. En un lugar que no es
  playa/laguna (datos viejos), también el dueño del lugar.
- Fotos: se guardan como URL completa, así que se validan acá: solo de
  nuestro Cloudinary y con el formato de esa playa ("{spot_id}/{16 hex}",
  el que firma can-upload). Antes se aceptaba cualquier URL.
"""
import re

from fastapi import HTTPException

from auth import is_admin
from contributions import public_id_from_url
from ownership import is_public_venue

PHOTO_FIELDS = ["photo_1", "photo_2", "photo_3"]


def assert_valid_photos(spot_id: int, urls, keep=()):
    """`keep`: URLs que el operador ya tenía (al editar, no se revalidan)."""
    for url in urls:
        if not url or url in keep:
            continue
        public_id = public_id_from_url(url)
        if (
            not url.startswith("https://res.cloudinary.com/")
            or not public_id
            or not re.fullmatch(rf"(rumbo/spots/)?{spot_id}/[0-9a-f]{{16}}", public_id)
        ):
            raise HTTPException(status_code=400, detail="Foto con formato inválido")


def can_manage_operator(operator, spot, user: dict) -> bool:
    if is_admin(user):
        return True
    email = user.get("email")
    if operator.owner_email and operator.owner_email == email:
        return True
    return not is_public_venue(spot) and spot.owner_email == email


def assert_can_manage_operator(operator, spot, user: dict):
    if not can_manage_operator(operator, spot, user):
        raise HTTPException(status_code=403, detail="No autorizado")
