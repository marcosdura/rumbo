import os
import re
import threading
import time
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests
from google.auth import exceptions as google_exceptions
from typing import Optional

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID no está seteada — sin esto, verify_oauth2_token no valida audiencia")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
# El identificador permanente de Google (sub) de la cuenta admin. Opcional:
# si está, además del mail tiene que coincidir esto (el mail de una cuenta
# puede cambiar o volver a usarse; el sub no).
ADMIN_SUB = os.getenv("ADMIN_SUB")
security = HTTPBearer(auto_error=False)


class CachedCertsRequest:
    """El transporte para verificar tokens, guardando los certificados de
    Google el tiempo que Google indica (Cache-Control). Antes se bajaban en
    cada pedido, aunque el token fuera basura: cualquiera podía hacer que el
    backend le pegara a Google sin parar (lento para todos y, si Google lo
    frenaba, 503 para todos)."""

    DEFAULT_TTL = 3600

    def __init__(self, inner=None):
        self._inner = inner or requests.Request()
        self._cache: dict[str, tuple[float, object]] = {}
        self._lock = threading.Lock()

    def __call__(self, url, method="GET", **kwargs):
        if method != "GET":
            return self._inner(url, method=method, **kwargs)
        hit = self._cache.get(url)
        if hit and hit[0] > time.monotonic():
            return hit[1]
        with self._lock:
            hit = self._cache.get(url)
            if hit and hit[0] > time.monotonic():
                return hit[1]
            response = self._inner(url, method=method, **kwargs)
            if response.status == 200:
                self._cache[url] = (time.monotonic() + self._ttl(response.headers), response)
            return response

    def _ttl(self, headers) -> float:
        match = re.search(r"max-age=(\d+)", (headers or {}).get("Cache-Control", "") or "")
        return int(match.group(1)) if match else self.DEFAULT_TTL


_certs_request = CachedCertsRequest()
# Un token de Google tiene tres partes en base64url: lo que no tiene esa
# forma ni se intenta verificar.
_JWT_SHAPE = re.compile(r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    if not _JWT_SHAPE.match(credentials.credentials or ""):
        return None
    try:
        user_info = id_token.verify_oauth2_token(
            credentials.credentials,
            _certs_request,
            GOOGLE_CLIENT_ID
        )
        # Todo se decide por el mail (dueño, autor, admin): tiene que estar
        # verificado por Google.
        if user_info.get("email_verified") is not True:
            return None
        return user_info
    except google_exceptions.TransportError:
        raise HTTPException(status_code=503, detail="No se pudo verificar la sesión, intentá de nuevo")
    except Exception:
        return None


def get_current_user_required(user: Optional[dict] = Depends(get_current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return user


def is_admin(user: dict) -> bool:
    if not ADMIN_EMAIL or user.get("email") != ADMIN_EMAIL:
        return False
    return not ADMIN_SUB or user.get("sub") == ADMIN_SUB


def get_current_admin_user(user: dict = Depends(get_current_user_required)) -> dict:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="No autorizado")
    return user