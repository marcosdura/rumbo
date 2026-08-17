from fastapi import Request
from slowapi import Limiter


def get_client_ip(request: Request) -> str:
    # get_remote_address (el default de slowapi) usa request.client.host —
    # la IP de quien está directamente conectado por TCP al proceso. Detrás
    # del proxy/edge de Railway eso NO es el navegador del usuario, es el
    # proxy mismo, salvo que uvicorn arranque con --proxy-headers
    # --forwarded-allow-ips (no hay Procfile en el repo, así que no se puede
    # confirmar desde acá si está seteado). Sin este fix, es muy probable
    # que todos los usuarios compartan el mismo balde de rate limit.
    #
    # Se lee X-Forwarded-For directo del header HTTP en vez de depender de
    # esa config — funciona sin importar cómo esté armado uvicorn del otro
    # lado. Convención estándar: "cliente, proxy1, proxy2..." — el primer
    # valor es la IP real del cliente.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


limiter = Limiter(key_func=get_client_ip)
