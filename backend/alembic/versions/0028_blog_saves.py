"""blog saves

blog_saves: las guías del blog que cada uno guardó (aparte de los
favoritos de lugares).

Revision ID: 0028
Revises: 0027
Create Date: 2026-11-12 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0028'
down_revision: Union[str, Sequence[str], None] = '0027'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'blog_saves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['post_id'], ['blog_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'post_id', name='uq_blog_save_user_post'),
    )
    op.create_index(op.f('ix_blog_saves_id'), 'blog_saves', ['id'], unique=False)
    op.create_index(op.f('ix_blog_saves_user_id'), 'blog_saves', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_blog_saves_user_id'), table_name='blog_saves')
    op.drop_index(op.f('ix_blog_saves_id'), table_name='blog_saves')
    op.drop_table('blog_saves')
