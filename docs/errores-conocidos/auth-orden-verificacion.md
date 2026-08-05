# Error: verificación de usuario en orden erróneo (logout cada una hora)

**Estado: corregido.**

Este documento explica un bug que hacía que los usuarios logueados se desconectaran solos, aproximadamente una vez por hora, sin haber hecho nada raro. Se deja documentado acá para entender qué pasó y no volver a introducir el mismo error en el futuro.

---

## Índice

1. [Resumen rápido](#1-resumen-rápido)
2. [Cuál era el síntoma](#2-cuál-era-el-síntoma)
3. [Por qué pasaba](#3-por-qué-pasaba)
4. [Por qué era tan seguido (casi cada una hora, no algo raro)](#4-por-qué-era-tan-seguido-casi-cada-una-hora-no-algo-raro)
5. [Cómo se solucionó](#5-cómo-se-solucionó)
6. [Archivos que se modificaron](#6-archivos-que-se-modificaron)
7. [Qué aprender de esto para el futuro](#7-qué-aprender-de-esto-para-el-futuro)

---

## 1. Resumen rápido

El código que revisa "¿este usuario todavía existe?" corría **antes** que el código que renueva el token cuando vence. Como los dos usan una llamada al backend que puede devolver el mismo tipo de error (401) por motivos distintos, el sistema confundía "el token venció, es normal" con "este usuario fue borrado", y cerraba la sesión por las dudas — cuando en realidad no hacía falta, porque el token se podía haber renovado sin problema.

## 2. Cuál era el síntoma

Un usuario logueado, con la pestaña de Rumbo abierta, era desconectado solo después de un rato (típicamente cerca de una hora), sin haber cerrado sesión ni haber hecho nada fuera de lo común. Tenía que volver a loguearse con Google para seguir usando la app — aunque en teoría la sesión debía durar 7 días.

## 3. Por qué pasaba

Todo esto pasa dentro del callback `jwt` en `frontend/app/api/auth/[...nextauth]/route.js` — la función que NextAuth ejecuta cada vez que hay que revisar o actualizar la sesión (ver [`documentation/autenticacion.md`](../documentation/autenticacion.md) para el contexto completo de cómo funciona todo esto).

Adentro de esa función pasaban, en este orden:

1. **Primero**, se chequeaba si el usuario seguía existiendo en la base de datos, llamando a `GET /users/me` en el backend con el `id_token` guardado en ese momento.
2. **Después**, recién ahí, se chequeaba si ese `id_token` ya había vencido, y si hacía falta pedirle uno nuevo a Google.

El problema es que `GET /users/me` puede devolver un error 401 ("no autenticado") por **dos motivos completamente distintos**, y el código no los distinguía:

- El token es válido, pero el usuario fue borrado de la base → en este caso el backend en realidad devuelve **404** ("no encontrado"), no 401.
- El token **ya venció** → acá el backend sí devuelve 401, porque ni siquiera puede confirmar quién sos.

El código trataba el 401 igual que el 404 — los dos hacían que se marcara la sesión como `"UserNotFound"` (usuario no encontrado) y se cerrara la sesión. Como el paso 1 (chequear si el usuario existe) corría **antes** que el paso 2 (renovar el token), cuando el token ya había vencido en el momento del chequeo, el sistema nunca llegaba a intentar renovarlo — directamente cerraba la sesión, pensando que el usuario ya no existía.

## 4. Por qué era tan seguido (casi cada una hora, no algo raro)

Dos configuraciones, cada una razonable por separado, se combinaban mal:

- El `id_token` de Google dura alrededor de **1 hora**.
- La app revisa la sesión cada **5 minutos** (`refetchInterval` en `Providers.jsx`), y el chequeo de "¿existe el usuario?" tenía la misma ventana de 5 minutos (`lastChecked`).

Como ambos números coincidían, prácticamente en cada revisión de 5 minutos se volvía a llamar a `GET /users/me`. Esto significa que, en algún momento de cada hora (justo cuando el token cumplía su hora de vida), la revisión de "¿existe el usuario?" caía exactamente en el momento en que el token ya estaba vencido — y ahí se disparaba el cierre de sesión, de forma casi garantizada, una vez por hora.

## 5. Cómo se solucionó

Se hicieron dos cambios en el mismo archivo:

1. **Se cambió el orden**: ahora primero se revisa si el token venció y, si hace falta, se renueva. Recién después de eso (con el token ya renovado si hacía falta) se hace el chequeo de "¿existe el usuario?".
2. **Se separaron los dos significados del error**: ahora **solo un 404 real** de `GET /users/me` hace que se cierre la sesión por "usuario no encontrado". Un 401, o un error de red al hacer esa llamada, ya no cierran la sesión — se ignoran y se reintenta en la próxima revisión (esto se llama "fail-open": ante la duda, no perjudicar al usuario).

Además, como medida extra de seguridad, se separaron los dos intervalos que antes coincidían: la revisión de "¿existe el usuario?" pasó de cada 5 a cada **10 minutos**, para que no vuelva a coincidir justo con el intervalo de 5 minutos de la revisión general de sesión.

## 6. Archivos que se modificaron

- `frontend/app/api/auth/[...nextauth]/route.js` — reordenamiento explicado arriba, y separación del 404/401.
- `frontend/components/layout/Providers.jsx` — se aprovechó el mismo cambio para que `AuthErrorHandler` también reaccione a un tercer tipo de error (`SignupError`, relacionado pero no es este mismo bug — ver el archivo `documentation/autenticacion.md` para más detalle).

## 7. Qué aprender de esto para el futuro

- Cuando dos partes del código dependen de intervalos de tiempo parecidos (acá: cada 5 minutos vs. cada 1 hora), conviene pensar qué pasa si se cruzan justo en el peor momento, no solo si funcionan bien por separado.
- Un mismo código de error HTTP (en este caso, 401) puede significar cosas distintas según el endpoint y el motivo. Antes de tratarlos igual, vale la pena confirmar que realmente significan lo mismo.
- Ante la duda de si cerrar la sesión de alguien o no, conviene equivocarse para el lado de **no** hacerlo (fail-open) — es mucho menos molesto para el usuario que un error de red transitorio se ignore y se reintente, a que se lo desconecte sin motivo real.
