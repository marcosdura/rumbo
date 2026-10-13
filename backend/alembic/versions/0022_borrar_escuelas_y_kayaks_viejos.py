"""borrar escuelas y kayaks viejos

Las escuelas de surf y los servicios de kayak ya son lugares (0021 copió
sus datos a spots, surf_details y kayak_service_details). Se borran sus
tablas viejas: surf_beach, kayak_details, sus reseñas y sus pedidos de
cambio. Primero las que apuntan a otras (reseñas), después el resto.

Revision ID: 0022
Revises: 0021
Create Date: 2026-10-13 14:01:19.557250

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0022'
down_revision: Union[str, Sequence[str], None] = '0021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # drop_table borra también sus índices.
    for table in ("surf_reviews", "kayak_reviews", "operator_change_requests", "surf_beach", "kayak_details"):
        op.drop_table(table)


def downgrade() -> None:
    # Las tablas vacías, con su forma de 0021 (los datos ya viven en spots).
    op.create_table('surf_beach',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('spot_id', sa.INTEGER(), nullable=True),
    sa.Column('name', sa.VARCHAR(), nullable=True),
    sa.Column('class_type', sa.VARCHAR(), nullable=True),
    sa.Column('duration', sa.FLOAT(), nullable=True),
    sa.Column('equipment_include', sa.BOOLEAN(), nullable=True),
    sa.Column('email', sa.VARCHAR(), nullable=True),
    sa.Column('whatsapp', sa.VARCHAR(), nullable=True),
    sa.Column('instagram', sa.VARCHAR(), nullable=True),
    sa.Column('season_start', sa.INTEGER(), nullable=True),
    sa.Column('season_end', sa.INTEGER(), nullable=True),
    sa.Column('photo_1', sa.VARCHAR(), nullable=True),
    sa.Column('photo_2', sa.VARCHAR(), nullable=True),
    sa.Column('photo_3', sa.VARCHAR(), nullable=True),
    sa.Column('is_approved', sa.BOOLEAN(), server_default=sa.true(), nullable=False),
    sa.Column('owner_email', sa.VARCHAR(), nullable=True),
    sa.Column('levels', sa.JSON(), nullable=True),
    sa.Column('languages', sa.JSON(), nullable=True),
    sa.Column('description', sa.TEXT(), nullable=True),
    sa.Column('price_from', sa.INTEGER(), nullable=True),
    sa.Column('price_note', sa.VARCHAR(length=60), nullable=True),
    sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_surf_beach_spot_id'), 'surf_beach', ['spot_id'], unique=False)
    op.create_index(op.f('ix_surf_beach_owner_email'), 'surf_beach', ['owner_email'], unique=False)
    op.create_index(op.f('ix_surf_beach_is_approved'), 'surf_beach', ['is_approved'], unique=False)
    op.create_index(op.f('ix_surf_beach_id'), 'surf_beach', ['id'], unique=False)
    op.create_table('kayak_details',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('spot_id', sa.INTEGER(), nullable=True),
    sa.Column('name', sa.VARCHAR(), nullable=True),
    sa.Column('water_type', sa.VARCHAR(), nullable=True),
    sa.Column('difficulty', sa.VARCHAR(), nullable=True),
    sa.Column('duration', sa.FLOAT(), nullable=True),
    sa.Column('kayak_type', sa.VARCHAR(), nullable=True),
    sa.Column('rental_available', sa.BOOLEAN(), nullable=True),
    sa.Column('email', sa.VARCHAR(), nullable=True),
    sa.Column('whatsapp', sa.VARCHAR(), nullable=True),
    sa.Column('instagram', sa.VARCHAR(), nullable=True),
    sa.Column('season_start', sa.INTEGER(), nullable=True),
    sa.Column('season_end', sa.INTEGER(), nullable=True),
    sa.Column('photo_1', sa.VARCHAR(), nullable=True),
    sa.Column('photo_2', sa.VARCHAR(), nullable=True),
    sa.Column('photo_3', sa.VARCHAR(), nullable=True),
    sa.Column('is_approved', sa.BOOLEAN(), server_default=sa.true(), nullable=False),
    sa.Column('owner_email', sa.VARCHAR(), nullable=True),
    sa.Column('includes_guide', sa.BOOLEAN(), nullable=True),
    sa.Column('includes_life_jacket', sa.BOOLEAN(), nullable=True),
    sa.Column('description', sa.TEXT(), nullable=True),
    sa.Column('price_from', sa.INTEGER(), nullable=True),
    sa.Column('price_note', sa.VARCHAR(length=60), nullable=True),
    sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kayak_details_spot_id'), 'kayak_details', ['spot_id'], unique=False)
    op.create_index(op.f('ix_kayak_details_owner_email'), 'kayak_details', ['owner_email'], unique=False)
    op.create_index(op.f('ix_kayak_details_is_approved'), 'kayak_details', ['is_approved'], unique=False)
    op.create_index(op.f('ix_kayak_details_id'), 'kayak_details', ['id'], unique=False)
    op.create_table('operator_change_requests',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('kind', sa.VARCHAR(), nullable=False),
    sa.Column('operator_id', sa.INTEGER(), nullable=False),
    sa.Column('spot_id', sa.INTEGER(), nullable=False),
    sa.Column('requested_by', sa.VARCHAR(), nullable=False),
    sa.Column('status', sa.VARCHAR(), nullable=False),
    sa.Column('changes', sa.JSON(), nullable=False),
    sa.Column('reject_reason', sa.VARCHAR(), nullable=True),
    sa.Column('created_at', sa.DATETIME(), server_default=sa.func.now(), nullable=False),
    sa.Column('resolved_at', sa.DATETIME(), nullable=True),
    sa.Column('resolved_by', sa.VARCHAR(), nullable=True),
    sa.Column('owner_dismissed_at', sa.DATETIME(), nullable=True),
    sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('uq_operator_change_pending'), 'operator_change_requests', ['kind', 'operator_id'], unique=True, sqlite_where=sa.text("status = 'pending'"), postgresql_where=sa.text("status = 'pending'"))
    op.create_index(op.f('ix_operator_change_requests_status'), 'operator_change_requests', ['status'], unique=False)
    op.create_index(op.f('ix_operator_change_requests_spot_id'), 'operator_change_requests', ['spot_id'], unique=False)
    op.create_index(op.f('ix_operator_change_requests_id'), 'operator_change_requests', ['id'], unique=False)
    op.create_table('surf_reviews',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('surf_beach_id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.VARCHAR(), nullable=False),
    sa.Column('rating', sa.INTEGER(), nullable=False),
    sa.Column('comment', sa.TEXT(), nullable=True),
    sa.Column('created_at', sa.DATETIME(), server_default=sa.func.now(), nullable=True),
    sa.Column('updated_at', sa.DATETIME(), nullable=True),
    sa.ForeignKeyConstraint(['surf_beach_id'], ['surf_beach.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'surf_beach_id', name=op.f('uq_surfreview_user_beach'))
    )
    op.create_index(op.f('ix_surf_reviews_surf_beach_id'), 'surf_reviews', ['surf_beach_id'], unique=False)
    op.create_table('kayak_reviews',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('kayak_details_id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.VARCHAR(), nullable=False),
    sa.Column('rating', sa.INTEGER(), nullable=False),
    sa.Column('comment', sa.TEXT(), nullable=True),
    sa.Column('created_at', sa.DATETIME(), server_default=sa.func.now(), nullable=True),
    sa.Column('updated_at', sa.DATETIME(), nullable=True),
    sa.ForeignKeyConstraint(['kayak_details_id'], ['kayak_details.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'kayak_details_id', name=op.f('uq_kayakreview_user_detail'))
    )
    op.create_index(op.f('ix_kayak_reviews_kayak_details_id'), 'kayak_reviews', ['kayak_details_id'], unique=False)
