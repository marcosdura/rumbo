"""La migración 0021 pasa las escuelas de surf y los servicios de kayak a
lugares, con sus fotos, reseñas, datos propios y reportes."""
import os
import tempfile

from alembic import command
from sqlalchemy import create_engine, text

from conftest import DB_URL, alembic_config

PHOTO = "https://res.cloudinary.com/dt0eisu0b/image/upload/v17/rumbo/spots/Surf/Ola/Ola{n}.jpg"


def migrate(setup):
    path = os.path.join(tempfile.mkdtemp(), "mig.db")
    url = f"sqlite:///{path}"
    command.upgrade(alembic_config(url), "0020")
    engine = create_engine(url)
    with engine.begin() as c:
        c.execute(text("INSERT INTO categories (id, name) VALUES (4, 'Surf'), (5, 'Kayak')"))
        c.execute(text(
            "INSERT INTO spots (id, name, slug, description, department, lat, lng, category_id, is_approved, suggested_by_visitor) VALUES "
            "(1, 'Playa El Emir', 'playa-el-emir', 'x', 'Maldonado', -34.96, -54.94, 4, 1, 0),"
            "(2, 'Laguna Garzón', 'laguna-garzon', 'x', 'Rocha', -34.8, -54.6, 5, 0, 0)"))
        c.execute(text("INSERT INTO users (id, email) VALUES ('u1', 'ana@x.com'), ('u2', 'beto@x.com')"))
        setup(c)
    command.upgrade(alembic_config(url), "head")
    return engine


def q(engine, sql, **params):
    with engine.connect() as c:
        return [dict(r._mapping) for r in c.execute(text(sql), params)]


def test_la_escuela_pasa_a_ser_un_lugar_con_sus_datos_fotos_y_resenias():
    def setup(c):
        c.execute(text(
            "INSERT INTO surf_beach (id, spot_id, name, class_type, duration, equipment_include, levels, languages, "
            "description, price_from, price_note, email, whatsapp, instagram, season_start, season_end, "
            "photo_1, photo_2, owner_email, is_approved) VALUES "
            "(7, 1, 'Escuela Ola', 'grupal', 1.5, 1, '[\"principiante\"]', '[\"espanol\", \"ingles\"]', "
            "'Clases para todos', 1200, 'por clase', 'ola@x.com', '099123456', '@ola', 11, 3, "
            ":p1, :p2, 'duenio@x.com', 1)"), {"p1": PHOTO.format(n=1), "p2": PHOTO.format(n=2)})
        c.execute(text("INSERT INTO surf_reviews (id, surf_beach_id, user_id, rating, comment) VALUES (3, 7, 'u1', 5, 'Genial')"))
        c.execute(text("INSERT INTO reports (id, target_kind, target_id, spot_id, reporter_email, reason, status) VALUES "
                       "(1, 'surf_school', 7, 1, 'r@x.com', 'spam', 'open'), (2, 'surf_review', 3, 1, 'r@x.com', 'offensive', 'open')"))
        c.execute(text("INSERT INTO operator_change_requests (id, kind, operator_id, spot_id, requested_by, status, changes) VALUES "
                       "(1, 'surf_school', 7, 1, 'duenio@x.com', 'pending', '{}')"))

    engine = migrate(setup)
    try:
        [spot] = q(engine, "SELECT * FROM spots WHERE name = 'Escuela Ola'")
        assert (spot["slug"], spot["category_id"], spot["department"], spot["lat"], spot["lng"]) == ("escuela-ola", 4, "Maldonado", -34.96, -54.94)
        assert (spot["description"], spot["price"], spot["email"], spot["whatsapp"], spot["instagram"]) == ("Clases para todos", 1200, "ola@x.com", "099123456", "@ola")
        assert (spot["season_start"], spot["season_end"], spot["owner_email"], spot["is_approved"], spot["suggested_by_visitor"]) == (11, 3, "duenio@x.com", 1, 0)
        assert q(engine, "SELECT category_id, is_primary FROM spot_categories WHERE spot_id = :id", id=spot["id"]) == [{"category_id": 4, "is_primary": 1}]

        [detail] = q(engine, "SELECT * FROM surf_details WHERE spot_id = :id", id=spot["id"])
        assert (detail["class_type"], detail["duration"], detail["equipment_include"]) == ("grupal", 1.5, 1)
        assert (detail["levels"], detail["languages"]) == ('["principiante"]', '["espanol", "ingles"]')
        assert (detail["price_note"], detail["operates_at"], detail["legacy_id"]) == ("por clase", "Playa El Emir", 7)

        images = q(engine, "SELECT cloudinary_public_id, is_main, \"order\" FROM spot_images WHERE spot_id = :id ORDER BY \"order\"", id=spot["id"])
        assert images == [
            {"cloudinary_public_id": "rumbo/spots/Surf/Ola/Ola1", "is_main": 1, "order": 0},
            {"cloudinary_public_id": "rumbo/spots/Surf/Ola/Ola2", "is_main": 0, "order": 1},
        ]

        [review] = q(engine, "SELECT id, user_id, rating, comment FROM reviews WHERE spot_id = :id", id=spot["id"])
        assert (review["user_id"], review["rating"], review["comment"]) == ("u1", 5, "Genial")
        reports = q(engine, "SELECT id, target_kind, target_id, spot_id FROM reports ORDER BY id")
        assert reports == [
            {"id": 1, "target_kind": "spot", "target_id": spot["id"], "spot_id": spot["id"]},
            {"id": 2, "target_kind": "review", "target_id": review["id"], "spot_id": spot["id"]},
        ]
        assert q(engine, "SELECT status FROM operator_change_requests") == [{"status": "cancelled"}]
    finally:
        engine.dispose()
        os.environ["DATABASE_URL"] = DB_URL


def test_el_kayak_en_revision_queda_como_lugar_en_revision_sugerido_por_su_autor():
    def setup(c):
        c.execute(text(
            "INSERT INTO kayak_details (id, spot_id, name, water_type, difficulty, rental_available, includes_guide, is_approved) VALUES "
            "(9, 2, 'Kayak Sur', 'lago', 'facil', 1, NULL, 0)"))
        c.execute(text("INSERT INTO contributions (kind, item_id, spot_id, author_email, status, title) VALUES "
                       "('kayak', 9, 2, 'beto@x.com', 'pending', 'Kayak Sur')"))

    engine = migrate(setup)
    try:
        [spot] = q(engine, "SELECT * FROM spots WHERE name = 'Kayak Sur'")
        assert (spot["category_id"], spot["is_approved"], spot["department"]) == (5, 0, "Rocha")
        # Sin dueño y sugerido por quien lo cargó, como un lugar de un visitante.
        assert (spot["owner_email"], spot["suggested_by_visitor"], spot["suggested_by_email"]) == ("beto@x.com", 1, "beto@x.com")
        [detail] = q(engine, "SELECT * FROM kayak_service_details WHERE spot_id = :id", id=spot["id"])
        assert (detail["water_type"], detail["difficulty"], detail["rental_available"], detail["includes_guide"]) == ("lago", "facil", 1, None)
        assert (detail["operates_at"], detail["legacy_id"]) == ("Laguna Garzón", 9)
        # El aporte pendiente lo reemplaza el lugar en revisión.
        assert q(engine, "SELECT * FROM contributions") == []
    finally:
        engine.dispose()
        os.environ["DATABASE_URL"] = DB_URL


def test_si_el_nombre_ya_es_de_otro_lugar_el_slug_no_choca():
    def setup(c):
        c.execute(text("INSERT INTO surf_beach (id, spot_id, name, is_approved) VALUES (1, 1, 'Playa El Emir', 1)"))

    engine = migrate(setup)
    try:
        slugs = sorted(r["slug"] for r in q(engine, "SELECT slug FROM spots WHERE name = 'Playa El Emir'"))
        assert slugs == ["playa-el-emir", "playa-el-emir-2"]
    finally:
        engine.dispose()
        os.environ["DATABASE_URL"] = DB_URL
