"""notificaciones

notifications: avisos dentro de la app (notifications.py).

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-06 17:12:35.265694

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0008'
down_revision: Union[str, Sequence[str], None] = '0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_email', sa.String(), nullable=False),
    sa.Column('kind', sa.String(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('body', sa.String(), nullable=True),
    sa.Column('link', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_email'), 'notifications', ['user_email'], unique=False)
    op.create_index('ix_notifications_user_unread', 'notifications', ['user_email', 'read_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notifications_user_unread', table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_email'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
