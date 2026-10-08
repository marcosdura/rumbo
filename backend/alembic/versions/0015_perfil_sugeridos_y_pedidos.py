"""perfil: sugeridos y pedidos

spots.suggested_by_email: quién sugirió el lugar como visitante (para
"Lugares que sugeriste"). Los que están en revisión todavía están a nombre
de quien los cargó, así que se copia; los ya aprobados pasaron al admin y
no guardaron quién los sugirió.

spot_claims.user_dismissed_at: quien pidió hacerse cargo cerró el aviso
del resultado en "Mis pedidos".

Revision ID: 0015
Revises: 0014
Create Date: 2026-10-08 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0015'
down_revision: Union[str, Sequence[str], None] = '0014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spot_claims', sa.Column('user_dismissed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('spots', sa.Column('suggested_by_email', sa.String(), nullable=True))
    op.create_index(op.f('ix_spots_suggested_by_email'), 'spots', ['suggested_by_email'], unique=False)
    op.execute("""
        UPDATE spots SET suggested_by_email = owner_email
        WHERE suggested_by_visitor = TRUE AND is_approved = FALSE AND owner_email IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_spots_suggested_by_email'), table_name='spots')
    op.drop_column('spots', 'suggested_by_email')
    op.drop_column('spot_claims', 'user_dismissed_at')
