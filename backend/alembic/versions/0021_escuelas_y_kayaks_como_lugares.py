"""escuelas de surf y servicios de kayak como lugares

Antes una escuela de surf (surf_beach) o un servicio de kayak (kayak_details)
colgaba de una playa o laguna, con fotos, reseñas y pedidos de cambio
propios. Ahora cada uno es un lugar (spots) de categoría Surf o Kayak, y lo
propio va en surf_details / kayak_service_details (con "dónde opera" en
texto libre: el nombre de la playa o laguna donde estaba).

Esta migración crea esas tablas y copia los datos:
- el lugar: nombre, descripción, contacto, precio, temporada, dueño y si
  estaba aprobado; el departamento y el punto del mapa, los de su playa;
- sus fotos (photo_1..3, URLs de Cloudinary) como fotos del lugar;
- sus reseñas (surf_reviews / kayak_reviews) como reseñas del lugar;
- los reportes abiertos sobre la escuela o sus reseñas, apuntando al lugar;
- los pedidos de cambio pendientes se cancelan, y los aportes pendientes o
  aprobados se borran: el lugar nuevo queda en revisión como cualquier
  lugar sugerido.

Las tablas viejas quedan: se borran en otra migración, junto con su código.

Revision ID: 0021
Revises: 0020
"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0021'
down_revision: Union[str, Sequence[str], None] = '0020'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _detail_table(name: str, *columns: sa.Column) -> None:
    op.create_table(
        name,
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('spot_id', sa.Integer(), nullable=False),
        *columns,
        sa.Column('price_note', sa.String(length=60), nullable=True),
        sa.Column('operates_at', sa.String(length=200), nullable=True),
        sa.Column('legacy_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['spot_id'], ['spots.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('spot_id'),
    )
    op.create_index(op.f(f'ix_{name}_legacy_id'), name, ['legacy_id'], unique=False)


# Tablas para copiar los datos (solo las columnas que se usan).
spots = sa.table(
    'spots',
    sa.column('id', sa.Integer), sa.column('name', sa.String), sa.column('description', sa.String),
    sa.column('department', sa.String), sa.column('lat', sa.Float), sa.column('lng', sa.Float),
    sa.column('category_id', sa.Integer), sa.column('price', sa.Integer),
    sa.column('email', sa.String), sa.column('whatsapp', sa.String), sa.column('instagram', sa.String),
    sa.column('owner_email', sa.String), sa.column('is_approved', sa.Boolean), sa.column('slug', sa.String),
    sa.column('season_start', sa.Integer), sa.column('season_end', sa.Integer),
    sa.column('suggested_by_visitor', sa.Boolean), sa.column('suggested_by_email', sa.String),
)
spot_categories = sa.table('spot_categories', sa.column('spot_id', sa.Integer), sa.column('category_id', sa.Integer), sa.column('is_primary', sa.Boolean))
spot_images = sa.table('spot_images', sa.column('spot_id', sa.Integer), sa.column('cloudinary_public_id', sa.String), sa.column('is_main', sa.Boolean), sa.column('order', sa.Integer))
reviews = sa.table(
    'reviews', sa.column('id', sa.Integer), sa.column('spot_id', sa.Integer), sa.column('user_id', sa.String),
    sa.column('rating', sa.Integer), sa.column('comment', sa.String),
    # Sin tipo: las fechas pasan tal cual se leyeron (texto en SQLite).
    sa.column('created_at'), sa.column('updated_at'),
)
reports = sa.table('reports', sa.column('id', sa.Integer), sa.column('target_kind', sa.String), sa.column('target_id', sa.Integer), sa.column('spot_id', sa.Integer), sa.column('status', sa.String))
contributions = sa.table('contributions', sa.column('kind', sa.String), sa.column('item_id', sa.Integer), sa.column('status', sa.String), sa.column('author_email', sa.String))
change_requests = sa.table('operator_change_requests', sa.column('kind', sa.String), sa.column('operator_id', sa.Integer), sa.column('status', sa.String), sa.column('resolved_at', sa.DateTime), sa.column('resolved_by', sa.String))

# Cómo era cada tipo antes.
OLD = {
    'surf_school': {
        'table': 'surf_beach', 'reviews': 'surf_reviews', 'review_fk': 'surf_beach_id', 'review_kind': 'surf_review',
        'category': 'Surf', 'detail': 'surf_details',
        'fields': ['class_type', 'duration', 'equipment_include', 'levels', 'languages'],
    },
    'kayak': {
        'table': 'kayak_details', 'reviews': 'kayak_reviews', 'review_fk': 'kayak_details_id', 'review_kind': 'kayak_review',
        'category': 'Kayak', 'detail': 'kayak_service_details',
        'fields': ['water_type', 'difficulty', 'duration', 'kayak_type', 'rental_available', 'includes_guide', 'includes_life_jacket'],
    },
}


def _slugify(name: str) -> str:
    """Igual que slugs.generate_slug (copiado: una migración no importa la app)."""
    slug = (name or '').lower().strip()
    for pattern, repl in ((r'[áàäâ]', 'a'), (r'[éèëê]', 'e'), (r'[íìïî]', 'i'), (r'[óòöô]', 'o'), (r'[úùüû]', 'u'), (r'[ñ]', 'n')):
        slug = re.sub(pattern, repl, slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    return re.sub(r'-+', '-', slug).strip('-') or 'lugar'


def _public_id(url):
    """Igual que contributions.public_id_from_url."""
    if not url:
        return None
    m = re.search(r"/upload/(?:[^/]*,[^/]*/)?(?:v\d+/)?(.+?)(?:\.[a-zA-Z0-9]+)?$", url)
    return m.group(1) if m else None


def _copy(bind, kind: str) -> None:
    cfg = OLD[kind]
    category_id = bind.execute(sa.text("SELECT id FROM categories WHERE name = :n"), {'n': cfg['category']}).scalar()
    taken = {row[0] for row in bind.execute(sa.text("SELECT slug FROM spots WHERE slug IS NOT NULL"))}
    old_rows = bind.execute(sa.text(f"SELECT * FROM {cfg['table']} ORDER BY id")).mappings().all()
    for op_row in old_rows:
        parent = bind.execute(sa.text("SELECT name, department, lat, lng FROM spots WHERE id = :id"), {'id': op_row['spot_id']}).mappings().first()
        author = bind.execute(
            sa.select(contributions.c.author_email).where(
                contributions.c.kind == kind, contributions.c.item_id == op_row['id'],
                contributions.c.status.in_(['pending', 'approved']),
            )
        ).scalar()
        owner = op_row['owner_email'] or author
        visitor = not op_row['owner_email'] and bool(author)

        base = _slugify(op_row['name'])
        slug, n = base, 2
        while slug in taken:
            slug, n = f'{base}-{n}', n + 1
        taken.add(slug)

        spot_id = bind.execute(
            spots.insert().values(
                name=op_row['name'], description=op_row['description'] or '',
                department=parent['department'] if parent else None,
                lat=parent['lat'] if parent else None, lng=parent['lng'] if parent else None,
                category_id=category_id, price=op_row['price_from'],
                email=op_row['email'], whatsapp=op_row['whatsapp'], instagram=op_row['instagram'],
                owner_email=owner, is_approved=bool(op_row['is_approved']), slug=slug,
                season_start=op_row['season_start'], season_end=op_row['season_end'],
                suggested_by_visitor=visitor, suggested_by_email=author if visitor else None,
            ).returning(spots.c.id)
        ).scalar()
        bind.execute(spot_categories.insert().values(spot_id=spot_id, category_id=category_id, is_primary=True))

        photos = [pid for pid in (_public_id(op_row[f'photo_{i}']) for i in (1, 2, 3)) if pid]
        for i, pid in enumerate(photos):
            bind.execute(spot_images.insert().values(spot_id=spot_id, cloudinary_public_id=pid, is_main=i == 0, order=i))

        detail = sa.table(cfg['detail'], *(sa.column(c) for c in ['spot_id', 'price_note', 'operates_at', 'legacy_id', *cfg['fields']]))
        bind.execute(detail.insert().values(
            spot_id=spot_id, price_note=op_row['price_note'], legacy_id=op_row['id'],
            operates_at=parent['name'] if parent else None,
            **{f: op_row[f] for f in cfg['fields']},
        ))

        # Reseñas y los reportes abiertos sobre ellas.
        old_reviews = bind.execute(sa.text(f"SELECT * FROM {cfg['reviews']} WHERE {cfg['review_fk']} = :id"), {'id': op_row['id']}).mappings().all()
        for rv in old_reviews:
            new_review_id = bind.execute(reviews.insert().values(
                spot_id=spot_id, user_id=rv['user_id'], rating=rv['rating'], comment=rv['comment'],
                created_at=rv['created_at'], updated_at=rv['updated_at'],
            ).returning(reviews.c.id)).scalar()
            bind.execute(reports.update().where(
                reports.c.target_kind == cfg['review_kind'], reports.c.target_id == rv['id'],
            ).values(target_kind='review', target_id=new_review_id, spot_id=spot_id))

        bind.execute(reports.update().where(reports.c.target_kind == kind, reports.c.target_id == op_row['id'])
                     .values(target_kind='spot', target_id=spot_id, spot_id=spot_id))
        bind.execute(change_requests.update().where(
            change_requests.c.kind == kind, change_requests.c.operator_id == op_row['id'], change_requests.c.status == 'pending',
        ).values(status='cancelled', resolved_at=sa.func.now(), resolved_by='migración 0021'))
        bind.execute(contributions.delete().where(
            contributions.c.kind == kind, contributions.c.item_id == op_row['id'], contributions.c.status.in_(['pending', 'approved']),
        ))


def upgrade() -> None:
    _detail_table(
        'surf_details',
        sa.Column('class_type', sa.String(), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('equipment_include', sa.Boolean(), nullable=True),
        sa.Column('levels', sa.JSON(), nullable=True),
        sa.Column('languages', sa.JSON(), nullable=True),
    )
    _detail_table(
        'kayak_service_details',
        sa.Column('water_type', sa.String(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('kayak_type', sa.String(), nullable=True),
        sa.Column('rental_available', sa.Boolean(), nullable=True),
        sa.Column('includes_guide', sa.Boolean(), nullable=True),
        sa.Column('includes_life_jacket', sa.Boolean(), nullable=True),
    )
    bind = op.get_bind()
    for kind in OLD:
        _copy(bind, kind)


def downgrade() -> None:
    # Los lugares copiados se borran (con sus fotos y reseñas, en cascada);
    # las escuelas y kayaks viejos siguen en sus tablas.
    bind = op.get_bind()
    for detail in ('surf_details', 'kayak_service_details'):
        ids = [r[0] for r in bind.execute(sa.text(f"SELECT spot_id FROM {detail} WHERE legacy_id IS NOT NULL"))]
        for spot_id in ids:
            bind.execute(sa.text("DELETE FROM spot_images WHERE spot_id = :id"), {'id': spot_id})
            bind.execute(sa.text("DELETE FROM reviews WHERE spot_id = :id"), {'id': spot_id})
            bind.execute(sa.text("DELETE FROM spot_categories WHERE spot_id = :id"), {'id': spot_id})
            bind.execute(sa.text(f"DELETE FROM {detail} WHERE spot_id = :id"), {'id': spot_id})
            bind.execute(sa.text("DELETE FROM spots WHERE id = :id"), {'id': spot_id})
        op.drop_index(op.f(f'ix_{detail}_legacy_id'), table_name=detail)
        op.drop_table(detail)
