"""La IP con la que se cuentan los límites de pedidos (limiter.py)."""
from starlette.requests import Request

from limiter import get_client_ip


def request(headers: dict[str, str], client=("10.0.0.9", 1234)) -> Request:
    return Request({
        "type": "http", "method": "GET", "path": "/", "query_string": b"",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": client,
    })


def test_detras_del_proxy_cuenta_la_ip_del_usuario_no_la_del_proxy():
    # El proxy de Railway reemplaza el X-Forwarded-For que manda el cliente
    # (probado contra producción: ver el comentario de get_client_ip).
    assert get_client_ip(request({"X-Forwarded-For": "190.64.1.2, 100.64.0.3"})) == "190.64.1.2"


def test_sin_proxy_cuenta_la_conexion():
    assert get_client_ip(request({})) == "10.0.0.9"
    assert get_client_ip(request({}, client=None)) == "127.0.0.1"
