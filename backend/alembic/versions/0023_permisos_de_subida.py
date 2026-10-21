"""permisos de subida

Cada firma para subir una foto a Cloudinary queda anotada (uploads.py): para
el tope de subidas por usuario y para borrar lo que se subió y nunca quedó
registrado.

Revision ID: 0023
Revises: 0022
Create Date: 2026-10-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0023'
down_revision: Union[str, Sequence[str], None] = '0022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('upload_tickets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('public_id', sa.String(), nullable=False),
    sa.Column('spot_id', sa.Integer(), nullable=False),
    sa.Column('user_email', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('public_id')
    )
    op.create_index(op.f('ix_upload_tickets_user_email'), 'upload_tickets', ['user_email'], unique=False)
    op.create_index(op.f('ix_upload_tickets_created_at'), 'upload_tickets', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_upload_tickets_created_at'), table_name='upload_tickets')
    op.drop_index(op.f('ix_upload_tickets_user_email'), table_name='upload_tickets')
    op.drop_table('upload_tickets')
