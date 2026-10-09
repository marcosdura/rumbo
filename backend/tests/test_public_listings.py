"""Los listados públicos de lugares no muestran datos de personas ni de la
moderación (routers/spots.PRIVATE_SPOT_FIELDS)."""
from conftest import OTHER, as_user

# Escrita acá y no importada del código: si alguien saca un campo de la
# lista del código, este test tiene que fallar.
PRIVATE = ("owner_email", "owner_phone", "suggested_by_email", "rejection_reason", "rejected_at", "owner_deleted_at")

LAT, LNG = -34.66, -54.16


def test_home_cercanos_favoritos_y_busqueda_sin_datos_privados(client, make_spot):
    a = make_spot(name="A", photos=1, owner_phone="099", suggested_by_email="visitante@x.com",
                  rejection_reason="viejo", lat=LAT, lng=LNG)
    make_spot(name="B", photos=1, owner_phone="098", lat=LAT + 0.01, lng=LNG)
    client.post(f"/favorites/{a.id}", headers=as_user(OTHER))
    listings = {
        "home": [sp for sec in client.get("/home").json()["sections"] for sp in sec["spots"]],
        "cercanos": client.get(f"/spots/{a.id}/nearby").json(),
        "favoritos": client.get("/favorites", headers=as_user(OTHER)).json(),
        "busqueda": client.get("/spots").json(),
    }
    for name, spots in listings.items():
        assert spots, name
        for spot in spots:
            leaked = {f: spot[f] for f in PRIVATE if spot.get(f)}
            assert leaked == {}, (name, leaked)


# -------- Favoritos --------

def test_favoritos_con_puntaje_solo_publicados_y_del_ultimo_al_primero(client, db, make_spot):
    from models import Review, User
    primero = make_spot(name="Primero", photos=1)
    segundo = make_spot(name="Segundo", photos=1)
    oculto = make_spot(name="Despublicado", photos=1)
    for spot in (primero, segundo, oculto):
        assert client.post(f"/favorites/{spot.id}", headers=as_user(OTHER)).status_code == 201
    oculto.is_approved = False
    db.add(User(id="u9", email="u9@t.com"))
    db.flush()
    db.add(Review(user_id="u9", spot_id=primero.id, rating=4))
    db.commit()
    favs = client.get("/favorites", headers=as_user(OTHER)).json()
    assert [f["name"] for f in favs] == ["Segundo", "Primero"]
    assert (favs[1]["average_rating"], favs[1]["review_count"]) == (4.0, 1)
    # Lo que usa la card.
    assert favs[0]["images"] and favs[0]["category"]["name"] == "Camping"
