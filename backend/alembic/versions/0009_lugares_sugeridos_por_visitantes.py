"""lugares sugeridos por visitantes

spots.suggested_by_visitor: lo cargó alguien que no es el responsable ni
el dueño; aprobado, pasa al admin (ownership.is_admin_managed).

Revision ID: 0009
Revises: 0008
Create Date: 2026-10-07 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0009'
down_revision: Union[str, Sequence[str], None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Todo lo existente lo cargó su responsable (así funcionaba hasta ahora).
    op.add_column('spots', sa.Column('suggested_by_visitor', sa.Boolean(), server_default=sa.false(), nullable=False))


def downgrade() -> None:
    op.drop_column('spots', 'suggested_by_visitor')
