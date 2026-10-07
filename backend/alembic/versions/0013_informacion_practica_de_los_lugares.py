"""informacion practica de los lugares

spots.pets_allowed / reservation_required / cell_signal (null = no sé),
para cualquier lugar. Mascotas y señal antes estaban repartidas:
trekking_details.pet_friendly y .signal, glamping_amenities.pet_friendly y
el amenity "Acepta mascotas" de los campings. Se copian acá (las columnas
viejas quedan, sin usarse, para no perder datos).

Revision ID: 0013
Revises: 0012
Create Date: 2026-10-07 18:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0013'
down_revision: Union[str, Sequence[str], None] = '0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spots', sa.Column('pets_allowed', sa.Boolean(), nullable=True))
    op.add_column('spots', sa.Column('reservation_required', sa.Boolean(), nullable=True))
    op.add_column('spots', sa.Column('cell_signal', sa.Boolean(), nullable=True))

    # Mascotas: lo que digan trekking y glamping; si no, el amenity del camping.
    op.execute("""
        UPDATE spots SET pets_allowed = (
            SELECT t.pet_friendly FROM trekking_details t WHERE t.spot_id = spots.id
        )
        WHERE pets_allowed IS NULL AND EXISTS (
            SELECT 1 FROM trekking_details t WHERE t.spot_id = spots.id AND t.pet_friendly IS NOT NULL
        )
    """)
    op.execute("""
        UPDATE spots SET pets_allowed = (
            SELECT g.pet_friendly FROM glamping_amenities g WHERE g.spot_id = spots.id
        )
        WHERE pets_allowed IS NULL AND EXISTS (
            SELECT 1 FROM glamping_amenities g WHERE g.spot_id = spots.id AND g.pet_friendly IS NOT NULL
        )
    """)
    op.execute("""
        UPDATE spots SET pets_allowed = TRUE
        WHERE pets_allowed IS NULL AND EXISTS (
            SELECT 1 FROM spot_amenities sa JOIN amenities a ON a.id = sa.amenity_id
            WHERE sa.spot_id = spots.id AND a.name = 'Acepta mascotas'
        )
    """)
    # Señal: solo existía en trekking.
    op.execute("""
        UPDATE spots SET cell_signal = (
            SELECT t.signal FROM trekking_details t WHERE t.spot_id = spots.id
        )
        WHERE EXISTS (
            SELECT 1 FROM trekking_details t WHERE t.spot_id = spots.id AND t.signal IS NOT NULL
        )
    """)


def downgrade() -> None:
    op.drop_column('spots', 'cell_signal')
    op.drop_column('spots', 'reservation_required')
    op.drop_column('spots', 'pets_allowed')
