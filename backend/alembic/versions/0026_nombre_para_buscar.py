"""nombre para buscar

spots.name_search: el nombre en minúsculas y sin tildes, para buscar lugares
por su nombre (text_search.py). Se completa para los que ya existen.

Revision ID: 0026
Revises: 0025
Create Date: 2026-10-22 10:00:00.000000

"""
import re
import unicodedata
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0026'
down_revision: Union[str, Sequence[str], None] = '0025'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize(text):
    # Igual que text_search.normalize (copiado: una migración no depende del
    # código de la app, que puede cambiar después).
    if not text:
        return ""
    plain = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", plain).strip().lower()


def upgrade() -> None:
    op.add_column('spots', sa.Column('name_search', sa.String(), nullable=True))
    op.create_index(op.f('ix_spots_name_search'), 'spots', ['name_search'], unique=False)
    conn = op.get_bind()
    for spot_id, name in conn.execute(sa.text("SELECT id, name FROM spots")).fetchall():
        conn.execute(sa.text("UPDATE spots SET name_search = :n WHERE id = :i"), {"n": _normalize(name), "i": spot_id})


def downgrade() -> None:
    op.drop_index(op.f('ix_spots_name_search'), table_name='spots')
    op.drop_column('spots', 'name_search')
