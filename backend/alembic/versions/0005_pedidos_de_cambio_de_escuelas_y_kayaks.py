"""pedidos de cambio de escuelas y kayaks

operator_change_requests: lo mismo que spot_change_requests para las
escuelas de surf y los servicios de kayak (operators.py). Un solo pedido
pendiente por operador (índice único parcial sobre kind + operator_id).

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-06 15:39:48.127029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('operator_change_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('kind', sa.String(), nullable=False),
    sa.Column('operator_id', sa.Integer(), nullable=False),
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
    op.create_index(op.f('ix_operator_change_requests_id'), 'operator_change_requests', ['id'], unique=False)
    op.create_index(op.f('ix_operator_change_requests_spot_id'), 'operator_change_requests', ['spot_id'], unique=False)
    op.create_index(op.f('ix_operator_change_requests_status'), 'operator_change_requests', ['status'], unique=False)
    op.create_index('uq_operator_change_pending', 'operator_change_requests', ['kind', 'operator_id'], unique=True, postgresql_where=sa.text("status = 'pending'"), sqlite_where=sa.text("status = 'pending'"))


def downgrade() -> None:
    op.drop_index('uq_operator_change_pending', table_name='operator_change_requests', postgresql_where=sa.text("status = 'pending'"), sqlite_where=sa.text("status = 'pending'"))
    op.drop_index(op.f('ix_operator_change_requests_status'), table_name='operator_change_requests')
    op.drop_index(op.f('ix_operator_change_requests_spot_id'), table_name='operator_change_requests')
    op.drop_index(op.f('ix_operator_change_requests_id'), table_name='operator_change_requests')
    op.drop_table('operator_change_requests')
