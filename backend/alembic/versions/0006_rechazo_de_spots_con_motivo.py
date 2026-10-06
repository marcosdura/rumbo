"""rechazo de spots con motivo

rejection_reason y rejected_at en spots: el admin rechaza un spot nuevo (o
despublica uno aprobado) con un motivo que el dueño ve, en vez de solo
poder borrarlo. Ver POST /admin/spots/{id}/reject y /spots/{id}/resubmit.

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-06 16:16:45.473003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spots', sa.Column('rejection_reason', sa.String(), nullable=True))
    op.add_column('spots', sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('spots', 'rejected_at')
    op.drop_column('spots', 'rejection_reason')
