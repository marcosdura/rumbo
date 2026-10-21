"""ultima actualizacion de lugares

La fecha en que cambió por última vez la información pública de cada lugar
(models.touch_spot_info). Los que ya existen arrancan con su fecha de
creación.

Revision ID: 0024
Revises: 0023
Create Date: 2026-10-21 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0024'
down_revision: Union[str, Sequence[str], None] = '0023'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spots', sa.Column('info_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE spots SET info_updated_at = created_at")


def downgrade() -> None:
    op.drop_column('spots', 'info_updated_at')
