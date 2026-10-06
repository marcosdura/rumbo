"""aportes a spots aprobados

- is_approved en las 7 tablas de cosas que se suman a un spot (experiencias,
  unidades de glamping, rutas, sectores, vías, surf, kayak). Todo lo que ya
  existía queda aprobado (server_default true).
- contributions: quién propuso cada aporte, estado y motivo de rechazo.

Generada con autogenerate contra SQLite y corregida a mano: el default
salía como sa.text('1'), que en Postgres falla para una columna boolean.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-06 11:43:27.057287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('contributions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('kind', sa.String(), nullable=False),
    sa.Column('item_id', sa.Integer(), nullable=False),
    sa.Column('spot_id', sa.Integer(), nullable=False),
    sa.Column('author_email', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('reject_reason', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resolved_by', sa.String(), nullable=True),
    sa.Column('author_dismissed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contributions_author_email'), 'contributions', ['author_email'], unique=False)
    op.create_index(op.f('ix_contributions_id'), 'contributions', ['id'], unique=False)
    op.create_index(op.f('ix_contributions_spot_id'), 'contributions', ['spot_id'], unique=False)
    op.create_index(op.f('ix_contributions_status'), 'contributions', ['status'], unique=False)
    op.add_column('climbingroutes', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_climbingroutes_is_approved'), 'climbingroutes', ['is_approved'], unique=False)
    op.add_column('climbingsectors', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_climbingsectors_is_approved'), 'climbingsectors', ['is_approved'], unique=False)
    op.add_column('experiences', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_experiences_is_approved'), 'experiences', ['is_approved'], unique=False)
    op.add_column('glamping_details', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_glamping_details_is_approved'), 'glamping_details', ['is_approved'], unique=False)
    op.add_column('kayak_details', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_kayak_details_is_approved'), 'kayak_details', ['is_approved'], unique=False)
    op.add_column('routes', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_routes_is_approved'), 'routes', ['is_approved'], unique=False)
    op.add_column('surf_beach', sa.Column('is_approved', sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_index(op.f('ix_surf_beach_is_approved'), 'surf_beach', ['is_approved'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_surf_beach_is_approved'), table_name='surf_beach')
    op.drop_column('surf_beach', 'is_approved')
    op.drop_index(op.f('ix_routes_is_approved'), table_name='routes')
    op.drop_column('routes', 'is_approved')
    op.drop_index(op.f('ix_kayak_details_is_approved'), table_name='kayak_details')
    op.drop_column('kayak_details', 'is_approved')
    op.drop_index(op.f('ix_glamping_details_is_approved'), table_name='glamping_details')
    op.drop_column('glamping_details', 'is_approved')
    op.drop_index(op.f('ix_experiences_is_approved'), table_name='experiences')
    op.drop_column('experiences', 'is_approved')
    op.drop_index(op.f('ix_climbingsectors_is_approved'), table_name='climbingsectors')
    op.drop_column('climbingsectors', 'is_approved')
    op.drop_index(op.f('ix_climbingroutes_is_approved'), table_name='climbingroutes')
    op.drop_column('climbingroutes', 'is_approved')
    op.drop_index(op.f('ix_contributions_status'), table_name='contributions')
    op.drop_index(op.f('ix_contributions_spot_id'), table_name='contributions')
    op.drop_index(op.f('ix_contributions_id'), table_name='contributions')
    op.drop_index(op.f('ix_contributions_author_email'), table_name='contributions')
    op.drop_table('contributions')
