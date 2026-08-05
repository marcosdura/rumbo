# Documentación de Rumbo

Este es el índice general de la carpeta `docs/`. Se va a ir completando con el tiempo, a medida que se agreguen más temas.

La carpeta tiene dos secciones:

- **`documentation/`** — explica cómo funcionan las distintas partes de la app (arquitectura, flujos, para qué sirve cada archivo).
- **`errores-conocidos/`** — registro de bugs que aparecieron y se corrigieron, para dejar memoria de qué pasó, por qué, y cómo se arregló. Sirve para no repetir el mismo error dos veces.

---

## Índice

### documentation/

| Documento | Descripción |
|---|---|
| [Autenticación](./documentation/autenticacion.md) | Cómo funciona el login con Google, la sesión, y la verificación de usuarios — tanto en el frontend como en el backend. |

### errores-conocidos/

| Documento | Descripción |
|---|---|
| [Orden de verificación en el login (auth)](./errores-conocidos/auth-orden-verificacion.md) | Bug donde el chequeo de "¿el usuario fue borrado?" corría antes que el refresh del token, y terminaba desconectando usuarios activos cada una hora aproximadamente. |
