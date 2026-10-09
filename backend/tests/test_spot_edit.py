"""PATCH /admin/spots/{id}: qué se aplica ya, qué va a revisión y qué se
rechaza antes de escribir nada (spot_changes.py)."""
from conftest import ADMIN, OTHER, OWNER, as_user, new_photo_id
from models import SpotChangeRequest, SpotDB, SpotImage


def patch(client, spot_id, body, user=OWNER, dry_run=False):
    params = {"dry_run": "true"} if dry_run else None
    return client.patch(f"/admin/spots/{spot_id}", json=body, params=params, headers=as_user(user))


def reload(db, spot_id):
    db.expire_all()
    return db.get(SpotDB, spot_id)


# -------- Clasificación --------

def test_sensibles_van_a_revision_e_instantaneos_se_aplican(client, db, make_spot):
    spot = make_spot(price=100)
    r = patch(client, spot.id, {"name": "Nuevo nombre", "price": 200, "photos_added": [new_photo_id(spot.id, 1)]})
    assert r.status_code == 200
    body = r.json()
    assert body["applied"] == ["price"]
    assert body["pending"] == ["name", "photos_added"]
    assert body["change_request"]["status"] == "pending"
    assert body["change_request"]["changes"]["name"] == {"from": "Cascada Escondida", "to": "Nuevo nombre"}

    spot = reload(db, spot.id)
    assert spot.name == "Cascada Escondida", "el público tiene que seguir viendo la versión aprobada"
    assert spot.price == 200
    assert db.query(SpotImage).filter_by(spot_id=spot.id).count() == 0, "las fotos del pedido no se publican"


def test_dry_run_clasifica_sin_escribir(client, db, make_spot):
    spot = make_spot(price=100)
    r = patch(client, spot.id, {"description": "Otra", "price": 300}, dry_run=True)
    assert r.status_code == 200
    assert r.json() == {"id": spot.id, "applied": ["price"], "pending": ["description"]}
    assert reload(db, spot.id).price == 100
    assert db.query(SpotChangeRequest).count() == 0


def test_instantaneos_sin_cambios_no_figuran_como_aplicados(client, make_spot):
    spot = make_spot(price=100, email="a@b.com")
    r = patch(client, spot.id, {"price": 100, "email": "a@b.com", "whatsapp": None}, dry_run=True)
    assert r.json()["applied"] == []


def test_espacios_en_los_bordes_no_crean_pedido(client, db, make_spot):
    spot = make_spot()
    r = patch(client, spot.id, {"name": "  Cascada Escondida  ", "description": "Una cascada linda "})
    assert r.status_code == 200
    assert r.json()["pending"] == []
    assert r.json()["change_request"] is None
    assert db.query(SpotChangeRequest).count() == 0


def test_el_duenio_pide_cambiar_la_ubicacion_y_va_a_revision(client, db, make_spot):
    # El departamento sigue siendo solo del admin: se ignora.
    spot = make_spot(lat=1.0, lng=2.0)
    r = patch(client, spot.id, {"department": "Salto", "lat": -34.5, "lng": -55.25})
    assert r.status_code == 200
    assert (r.json()["applied"], r.json()["pending"]) == ([], ["location"])
    assert r.json()["change_request"]["changes"]["location"] == {"from": [1.0, 2.0], "to": [-34.5, -55.25]}
    spot = reload(db, spot.id)
    assert (spot.department, spot.lat, spot.lng) == ("Rocha", 1.0, 2.0), "el público sigue viendo la ubicación aprobada"


def test_aprobar_el_pedido_mueve_el_lugar(client, db, make_spot):
    spot = make_spot(lat=1.0, lng=2.0)
    patch(client, spot.id, {"lat": -34.5, "lng": -55.25})
    [pending] = client.get("/admin/change-requests", headers=as_user(ADMIN)).json()
    assert pending["spot"]["current"]["location"] == [1.0, 2.0]
    assert client.post(f"/admin/change-requests/{pending['id']}/approve", headers=as_user(ADMIN)).status_code == 200
    spot = reload(db, spot.id)
    assert (spot.lat, spot.lng) == (-34.5, -55.25)


def test_ubicacion_sin_cambios_o_invalida(client, db, make_spot):
    spot = make_spot(lat=1.0, lng=2.0)
    r = patch(client, spot.id, {"lat": 1.0, "lng": 2.0})
    assert r.json()["pending"] == []
    assert patch(client, spot.id, {"lat": 1.0}).status_code == 422
    assert patch(client, spot.id, {"lat": 95.0, "lng": 2.0}).status_code == 422


def test_un_lugar_sin_aprobar_cambia_la_ubicacion_directo(client, db, make_spot):
    spot = make_spot(lat=1.0, lng=2.0, approved=False)
    r = patch(client, spot.id, {"lat": -34.5, "lng": -55.25})
    assert r.json()["applied"] == ["lat", "lng"]
    spot = reload(db, spot.id)
    assert (spot.lat, spot.lng) == (-34.5, -55.25)


def test_admin_edita_directo_incluida_ubicacion(client, db, make_spot):
    spot = make_spot()
    r = patch(client, spot.id, {"name": "Por admin", "department": "Salto"}, user=ADMIN)
    assert r.status_code == 200
    assert r.json()["pending"] == []
    spot = reload(db, spot.id)
    assert (spot.name, spot.department) == ("Por admin", "Salto")


def test_spot_no_aprobado_edita_directo_y_publica_fotos(client, db, make_spot):
    spot = make_spot(approved=False)
    photo = new_photo_id(spot.id, 1)
    r = patch(client, spot.id, {"name": "Directo", "photos_added": [photo]})
    assert r.status_code == 200
    assert r.json()["pending"] == []
    assert reload(db, spot.id).name == "Directo"
    img = db.query(SpotImage).filter_by(cloudinary_public_id=photo).one()
    assert img.is_main, "sin otras fotos, la nueva pasa a ser la principal"


# -------- Validaciones (no escriben nada si fallan) --------

def test_limite_de_10_fotos_bloquea_todo_el_guardado(client, db, make_spot):
    spot = make_spot(photos=8, price=100)
    photos = [new_photo_id(spot.id, n) for n in range(3)]
    r = patch(client, spot.id, {"price": 999, "photos_added": photos})
    assert r.status_code == 400
    assert "Tenés 8 y querés agregar 3: borrá al menos 1" in r.json()["detail"]
    assert reload(db, spot.id).price == 100, "si algo falla, tampoco se aplica lo instantáneo"


def test_limite_de_10_fotos_justo_entra(client, make_spot):
    spot = make_spot(photos=8)
    photos = [new_photo_id(spot.id, n) for n in range(2)]
    assert patch(client, spot.id, {"photos_added": photos}).status_code == 200


def test_nombre_repetido_sin_importar_mayusculas(client, make_spot):
    make_spot(name="Refugio del Sol", owner=OTHER)
    spot = make_spot()
    r = patch(client, spot.id, {"name": "refugio del sol"})
    assert r.status_code == 409


def test_nombre_vacio(client, make_spot):
    spot = make_spot()
    assert patch(client, spot.id, {"name": "   "}).status_code == 422


def test_foto_con_id_de_otro_spot(client, make_spot):
    otro = make_spot(name="Otro", owner=OTHER)
    spot = make_spot()
    r = patch(client, spot.id, {"photos_added": [new_photo_id(otro.id, 1)]})
    assert r.status_code == 400


def test_foto_con_formato_viejo(client, make_spot):
    spot = make_spot()
    r = patch(client, spot.id, {"photos_added": ["Camping/Cascada/Cascada1"]})
    assert r.status_code == 400


def test_foto_repetida_en_el_mismo_pedido(client, make_spot):
    spot = make_spot()
    photo = new_photo_id(spot.id, 1)
    assert patch(client, spot.id, {"photos_added": [photo, photo]}).status_code == 422


def test_texto_demasiado_largo(client, make_spot):
    spot = make_spot()
    assert patch(client, spot.id, {"description": "x" * 3001}).status_code == 422


def test_precio_con_decimales_se_rechaza(client, make_spot):
    # La columna es entera.
    spot = make_spot()
    assert patch(client, spot.id, {"price": 1500.5}).status_code == 422


# -------- Un pedido a la vez --------

def test_segundo_pedido_sensible_da_409(client, make_spot):
    spot = make_spot()
    assert patch(client, spot.id, {"name": "Primero"}).status_code == 200
    r = patch(client, spot.id, {"description": "Segundo"})
    assert r.status_code == 409


def test_con_pedido_abierto_lo_instantaneo_sigue_funcionando(client, db, make_spot):
    spot = make_spot()
    patch(client, spot.id, {"name": "Primero"})
    r = patch(client, spot.id, {"whatsapp": "099 123 456"})
    assert r.status_code == 200
    assert reload(db, spot.id).whatsapp == "099 123 456"


# -------- Permisos --------

def test_otro_usuario_no_puede_editar(client, make_spot):
    spot = make_spot()
    assert patch(client, spot.id, {"price": 1}, user=OTHER).status_code == 403


def test_sin_login(client, make_spot):
    spot = make_spot()
    assert client.patch(f"/admin/spots/{spot.id}", json={"price": 1}).status_code == 401


# -------- POST /images: el atajo que salteaba la revisión --------

def test_duenio_no_puede_publicar_fotos_directo_en_spot_aprobado(client, make_spot):
    spot = make_spot()
    r = client.post(f"/images/spots/{spot.id}", params={"cloudinary_public_id": new_photo_id(spot.id, 1)}, headers=as_user(OWNER))
    assert r.status_code == 403


def test_duenio_si_puede_en_spot_no_aprobado(client, make_spot):
    # Es el camino del alta de un spot nuevo (agregar-lugar).
    spot = make_spot(approved=False)
    r = client.post(f"/images/spots/{spot.id}", params={"cloudinary_public_id": new_photo_id(spot.id, 1)}, headers=as_user(OWNER))
    assert r.status_code == 200


def test_admin_si_puede_en_spot_aprobado(client, make_spot):
    spot = make_spot()
    r = client.post(f"/images/spots/{spot.id}", params={"cloudinary_public_id": new_photo_id(spot.id, 1)}, headers=as_user(ADMIN))
    assert r.status_code == 200
