"""Todo endpoint que escribe tiene límite de pedidos (limiter.py)."""
import glob
import os
import re

from conftest import OWNER, as_user
from limiter import limiter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTE = re.compile(r'((?:@[^\n]+\n)+)(?:async\s+)?def\s+(\w+)\(')


def write_endpoints():
    files = glob.glob(os.path.join(HERE, "routers", "*.py")) + [os.path.join(HERE, "review_router_factory.py")]
    for path in files:
        src = open(path, encoding="utf-8").read()
        for decos, name in ROUTE.findall(src):
            if re.search(r'@\w*router\.(post|put|patch|delete)\(', decos):
                yield os.path.basename(path), name, "limiter.limit" in decos


def test_todos_los_endpoints_de_escritura_tienen_limite():
    endpoints = list(write_endpoints())
    assert len(endpoints) > 60
    assert [f"{f}:{n}" for f, n, limited in endpoints if not limited] == []


def test_el_limite_corta_de_verdad(client):
    limiter.enabled = True
    limiter.reset()
    try:
        codes = [client.post("/notifications/read-all", headers=as_user(OWNER)).status_code for _ in range(31)]
    finally:
        limiter.enabled = False
    assert codes[:30] == [200] * 30 and codes[30] == 429
