import os
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
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        user_info = id_token.verify_oauth2_token(
            credentials.credentials,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
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
    return bool(ADMIN_EMAIL) and user.get("email") == ADMIN_EMAIL


def get_current_admin_user(user: dict = Depends(get_current_user_required)) -> dict:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="No autorizado")
    return user