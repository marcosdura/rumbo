"""Buscar lugares por su nombre sin que importen las tildes ni las
mayúsculas ("arequita" encuentra "Cerro Arequita", "rio" encuentra "Río").
El nombre normalizado vive en spots.name_search (models.keep_name_search)."""
import re
import unicodedata


def normalize(text: str | None) -> str:
    """Minúsculas, sin tildes y con un solo espacio entre palabras."""
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFKD", text)
    plain = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", plain).strip().lower()


def words(query: str | None) -> list[str]:
    """Las palabras de una búsqueda, normalizadas (todas tienen que estar)."""
    return [w for w in normalize(query).split(" ") if w]
