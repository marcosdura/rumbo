"""precio del camping en el lugar

El precio por noche de un camping vivía dos veces: spots.price (lo que
edita el dueño y muestra la card) y camping_details.price (lo que usaba el
filtro de precio). Al editar solo cambiaba el primero, así que el filtro
quedaba con el precio viejo. Desde ahora spots.price es el único que se lee;
acá se copia el del camping a los lugares que no tenían precio propio.

Revision ID: 0016
Revises: 0015
Create Date: 2026-10-09 12:00:00

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '0016'
down_revision: Union[str, Sequence[str], None] = '0015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        UPDATE spots SET price = (
            SELECT CAST(ROUND(c.price) AS INTEGER) FROM camping_details c WHERE c.spot_id = spots.id
        )
        WHERE price IS NULL AND EXISTS (
            SELECT 1 FROM camping_details c WHERE c.spot_id = spots.id AND c.price IS NOT NULL
        )
    """)


def downgrade() -> None:
    # Solo copia datos: no hay nada que deshacer.
    pass
