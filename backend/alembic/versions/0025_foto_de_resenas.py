"""foto de resenas

Cada reseña puede llevar una foto, que pasa por revisión como las de rutas,
sectores y vías: item_photos suma review_id (exactamente uno de los cuatro
destinos va cargado).

Revision ID: 0025
Revises: 0024
Create Date: 2026-10-21 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0025'
down_revision: Union[str, Sequence[str], None] = '0024'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

THREE = ("(CASE WHEN trekking_route_id IS NULL THEN 0 ELSE 1 END)"
         " + (CASE WHEN climbing_sector_id IS NULL THEN 0 ELSE 1 END)"
         " + (CASE WHEN climbing_route_id IS NULL THEN 0 ELSE 1 END)")


def upgrade() -> None:
    # batch: SQLite no cambia restricciones en el lugar (recrea la tabla).
    with op.batch_alter_table("item_photos") as batch:
        batch.add_column(sa.Column("review_id", sa.Integer(), nullable=True))
        batch.create_foreign_key("fk_item_photos_review_id", "reviews", ["review_id"], ["id"], ondelete="CASCADE")
        batch.create_index(batch.f("ix_item_photos_review_id"), ["review_id"], unique=False)
        batch.drop_constraint("item_photos_one_target", type_="check")
        batch.create_check_constraint("item_photos_one_target", THREE + " + (CASE WHEN review_id IS NULL THEN 0 ELSE 1 END) = 1")


def downgrade() -> None:
    op.execute("DELETE FROM item_photos WHERE review_id IS NOT NULL")
    with op.batch_alter_table("item_photos") as batch:
        batch.drop_constraint("item_photos_one_target", type_="check")
        batch.create_check_constraint("item_photos_one_target", THREE + " = 1")
        batch.drop_index(batch.f("ix_item_photos_review_id"))
        batch.drop_constraint("fk_item_photos_review_id", type_="foreignkey")
        batch.drop_column("review_id")
