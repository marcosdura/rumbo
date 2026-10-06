"""duenio propio de escuelas y kayaks

owner_email en surf_beach y kayak_details: la escuela o el servicio tiene
dueño propio (quien lo sumó a la playa), distinto del dueño del lugar. Las
filas existentes quedan en NULL (las maneja el admin).

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-06 15:34:58.169087

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('kayak_details', sa.Column('owner_email', sa.String(), nullable=True))
    op.create_index(op.f('ix_kayak_details_owner_email'), 'kayak_details', ['owner_email'], unique=False)
    op.add_column('surf_beach', sa.Column('owner_email', sa.String(), nullable=True))
    op.create_index(op.f('ix_surf_beach_owner_email'), 'surf_beach', ['owner_email'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_surf_beach_owner_email'), table_name='surf_beach')
    op.drop_column('surf_beach', 'owner_email')
    op.drop_index(op.f('ix_kayak_details_owner_email'), table_name='kayak_details')
    op.drop_column('kayak_details', 'owner_email')
