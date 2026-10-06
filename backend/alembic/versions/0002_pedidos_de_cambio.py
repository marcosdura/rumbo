"""pedidos de cambio de spots + indices de slug faltantes

- spot_change_requests: pedidos de cambio sobre spots aprobados
  (spot_changes.py). Índice único parcial: un solo pendiente por spot.
- ix_routes_slug / ix_climbingsectors_slug: los modelos los declaraban
  (index=True) pero create_all no agrega índices a tablas que ya existen,
  así que nunca se crearon en producción. Los usan las búsquedas por slug.

Revision ID: 0002
Revises: 0001
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0002'
down_revision: Union[str, Sequence[str], None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('spot_change_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('spot_id', sa.Integer(), nullable=False),
    sa.Column('requested_by', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('changes', sa.JSON(), nullable=False),
    sa.Column('reject_reason', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resolved_by', sa.String(), nullable=True),
    sa.Column('owner_dismissed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_spot_change_requests_id'), 'spot_change_requests', ['id'], unique=False)
    op.create_index(op.f('ix_spot_change_requests_spot_id'), 'spot_change_requests', ['spot_id'], unique=False)
    op.create_index(op.f('ix_spot_change_requests_status'), 'spot_change_requests', ['status'], unique=False)
    op.create_index('uq_spot_change_pending', 'spot_change_requests', ['spot_id'], unique=True, postgresql_where=sa.text("status = 'pending'"), sqlite_where=sa.text("status = 'pending'"))
    op.create_index(op.f('ix_climbingsectors_slug'), 'climbingsectors', ['slug'], unique=False)
    op.create_index(op.f('ix_routes_slug'), 'routes', ['slug'], unique=False)


def downgrade() -> None:
    op.drop_index('uq_spot_change_pending', table_name='spot_change_requests', postgresql_where=sa.text("status = 'pending'"), sqlite_where=sa.text("status = 'pending'"))
    op.drop_index(op.f('ix_spot_change_requests_status'), table_name='spot_change_requests')
    op.drop_index(op.f('ix_spot_change_requests_spot_id'), table_name='spot_change_requests')
    op.drop_index(op.f('ix_spot_change_requests_id'), table_name='spot_change_requests')
    op.drop_table('spot_change_requests')
    op.drop_index(op.f('ix_routes_slug'), table_name='routes')
    op.drop_index(op.f('ix_climbingsectors_slug'), table_name='climbingsectors')
