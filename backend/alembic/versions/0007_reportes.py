"""reportes

reports: un usuario reporta un spot, una reseña o una escuela/kayak
(reports.py). Un reporte abierto por persona y por cosa reportada (índice
único parcial).

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-06 16:31:23.083696

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007'
down_revision: Union[str, Sequence[str], None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('reports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('target_kind', sa.String(), nullable=False),
    sa.Column('target_id', sa.Integer(), nullable=False),
    sa.Column('spot_id', sa.Integer(), nullable=False),
    sa.Column('reporter_email', sa.String(), nullable=False),
    sa.Column('reason', sa.String(), nullable=False),
    sa.Column('comment', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('resolution', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('resolved_by', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_id'), 'reports', ['id'], unique=False)
    op.create_index(op.f('ix_reports_reporter_email'), 'reports', ['reporter_email'], unique=False)
    op.create_index(op.f('ix_reports_spot_id'), 'reports', ['spot_id'], unique=False)
    op.create_index(op.f('ix_reports_status'), 'reports', ['status'], unique=False)
    op.create_index('uq_report_open', 'reports', ['reporter_email', 'target_kind', 'target_id'], unique=True, postgresql_where=sa.text("status = 'open'"), sqlite_where=sa.text("status = 'open'"))


def downgrade() -> None:
    op.drop_index('uq_report_open', table_name='reports', postgresql_where=sa.text("status = 'open'"), sqlite_where=sa.text("status = 'open'"))
    op.drop_index(op.f('ix_reports_status'), table_name='reports')
    op.drop_index(op.f('ix_reports_spot_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_reporter_email'), table_name='reports')
    op.drop_index(op.f('ix_reports_id'), table_name='reports')
    op.drop_table('reports')
