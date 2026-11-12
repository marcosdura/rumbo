"""blog

blog_posts: las notas del blog (blog.py).

Revision ID: 0027
Revises: 0026
Create Date: 2026-11-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0027'
down_revision: Union[str, Sequence[str], None] = '0026'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'blog_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('summary', sa.String(length=300), nullable=True),
        sa.Column('cover_image', sa.String(), nullable=True),
        sa.Column('category', sa.String(length=30), nullable=False),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),
        sa.Column('featured', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('map', sa.JSON(), nullable=True),
        sa.Column('blocks', sa.JSON(), nullable=False),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_blog_posts_id'), 'blog_posts', ['id'], unique=False)
    op.create_index(op.f('ix_blog_posts_slug'), 'blog_posts', ['slug'], unique=True)
    op.create_index(op.f('ix_blog_posts_category'), 'blog_posts', ['category'], unique=False)
    op.create_index(op.f('ix_blog_posts_status'), 'blog_posts', ['status'], unique=False)
    op.create_index(op.f('ix_blog_posts_published_at'), 'blog_posts', ['published_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_blog_posts_published_at'), table_name='blog_posts')
    op.drop_index(op.f('ix_blog_posts_status'), table_name='blog_posts')
    op.drop_index(op.f('ix_blog_posts_category'), table_name='blog_posts')
    op.drop_index(op.f('ix_blog_posts_slug'), table_name='blog_posts')
    op.drop_index(op.f('ix_blog_posts_id'), table_name='blog_posts')
    op.drop_table('blog_posts')
