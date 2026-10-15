"""Verificación de tokens (auth.py): certificados de Google guardados, mail
verificado y admin por sub."""
from fastapi.security import HTTPAuthorizationCredentials

import auth

FAKE_JWT = "aaa.bbb.ccc"


class FakeResponse:
    def __init__(self, max_age=600):
        self.status = 200
        self.headers = {"Cache-Control": f"public, max-age={max_age}"}
        self.data = b"{}"


class CountingTransport:
    def __init__(self):
        self.calls = 0

    def __call__(self, url, method="GET", **kwargs):
        self.calls += 1
        return FakeResponse()


def bearer(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_los_certificados_se_bajan_una_vez_aunque_lleguen_muchos_tokens_falsos(monkeypatch):
    transport = CountingTransport()
    monkeypatch.setattr(auth, "_certs_request", auth.CachedCertsRequest(transport))
    for _ in range(5):
        assert auth.get_current_user(bearer(FAKE_JWT)) is None
    assert transport.calls == 1


def test_lo_que_no_tiene_forma_de_token_ni_se_intenta_verificar(monkeypatch):
    transport = CountingTransport()
    monkeypatch.setattr(auth, "_certs_request", auth.CachedCertsRequest(transport))
    for junk in ("x", "a.b", "a.b.c.d", "<script>.a.b"):
        assert auth.get_current_user(bearer(junk)) is None
    assert transport.calls == 0


def test_se_vuelven_a_bajar_cuando_vencen(monkeypatch):
    transport = CountingTransport()
    cached = auth.CachedCertsRequest(transport)
    now = [1000.0]
    monkeypatch.setattr(auth.time, "monotonic", lambda: now[0])
    cached("https://certs")
    now[0] += 599
    cached("https://certs")
    assert transport.calls == 1
    now[0] += 2
    cached("https://certs")
    assert transport.calls == 2


def test_un_mail_sin_verificar_no_inicia_sesion(monkeypatch):
    claims = {"email": "x@test.com", "sub": "1", "email_verified": False}
    monkeypatch.setattr(auth.id_token, "verify_oauth2_token", lambda *a, **k: dict(claims))
    assert auth.get_current_user(bearer(FAKE_JWT)) is None
    claims["email_verified"] = True
    assert auth.get_current_user(bearer(FAKE_JWT))["email"] == "x@test.com"
    del claims["email_verified"]
    assert auth.get_current_user(bearer(FAKE_JWT)) is None


def test_admin_por_mail_y_ademas_por_sub_si_esta_configurado(monkeypatch):
    monkeypatch.setattr(auth, "ADMIN_EMAIL", "admin@test.com")
    monkeypatch.setattr(auth, "ADMIN_SUB", None)
    assert auth.is_admin({"email": "admin@test.com", "sub": "cualquiera"})
    monkeypatch.setattr(auth, "ADMIN_SUB", "123")
    assert auth.is_admin({"email": "admin@test.com", "sub": "123"})
    # Mismo mail en otra cuenta (otro sub): no es admin.
    assert not auth.is_admin({"email": "admin@test.com", "sub": "999"})
    assert not auth.is_admin({"email": "otro@test.com", "sub": "123"})
