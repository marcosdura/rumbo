# Autenticación en Rumbo

Este documento explica cómo funciona el login y la verificación de usuarios en Rumbo: qué pasa cuando alguien inicia sesión, cómo se sabe si sigue logueado, cuánto dura esa sesión, y qué archivo hace qué.

Está escrito para poder entenderlo sin conocer los detalles internos de NextAuth o de Google OAuth de antemano — los conceptos se explican a medida que aparecen.

---

## Índice

1. [Idea general](#1-idea-general)
2. [Conceptos básicos, explicados simple](#2-conceptos-básicos-explicados-simple)
3. [Archivos del frontend y su función](#3-archivos-del-frontend-y-su-función)
4. [Archivos del backend y su función](#4-archivos-del-backend-y-su-función)
5. [El flujo completo, paso a paso](#5-el-flujo-completo-paso-a-paso)
6. [Cuánto dura la sesión](#6-cuánto-dura-la-sesión)
7. [Qué endpoints piden login y cuáles no](#7-qué-endpoints-piden-login-y-cuáles-no)
8. [Variables de entorno involucradas](#8-variables-de-entorno-involucradas)

---

## 1. Idea general

Rumbo no tiene un sistema de login propio (no hay pantalla de "usuario y contraseña"). Todo el login se hace **a través de Google** — el usuario aprieta "Continuar con Google", elige su cuenta, y Google le devuelve a Rumbo una prueba de que esa persona es quién dice ser.

Hay dos partes separadas que hay que entender por separado:

- **El frontend** (Next.js) usa una librería llamada **NextAuth** para manejar todo el proceso de login con Google, y guarda la sesión en una cookie del navegador.
- **El backend** (FastAPI, el servidor que tiene la base de datos) **no tiene sesión propia**. En cada pedido que le llega, el backend recibe la prueba que dio Google y la revisa de nuevo, ahí mismo, para confirmar que es válida. No confía ciegamente en el frontend.

Esto es importante: **el backend no le pregunta al frontend "¿este usuario está logueado?"**. El backend verifica todo de cero, cada vez, usando la prueba que Google le dio al usuario.

---

## 2. Conceptos básicos, explicados simple

Antes de entrar en los archivos, unas palabras que van a aparecer todo el tiempo:

- **Token**: una cadena de texto larga y rara que sirve como "comprobante". No es una contraseña, es más como una entrada de cine: la mostrás y te dejan pasar, pero vence después de un rato.
- **`id_token`**: el token específico que da Google después del login. Adentro tiene, entre otras cosas, el email de la persona y la fecha en la que deja de ser válido. Cualquiera puede leer lo que dice adentro (no es secreto), pero está firmado digitalmente por Google, así que nadie puede inventarse uno falso — el backend puede comprobar la firma.
- **`refresh_token`**: otro token, que no vence (a menos que el usuario le saque el acceso a Rumbo desde su cuenta de Google). Sirve para pedirle a Google un `id_token` nuevo sin que el usuario tenga que volver a loguearse.
- **Cookie de sesión**: un archivito que el navegador guarda, que en este caso contiene toda la información del login (guardada de forma cifrada). Es lo que hace que, al recargar la página, sigas logueado sin tener que volver a hacer nada.
- **JWT**: la forma en la que están armados tanto el `id_token` de Google como la cookie de sesión de NextAuth — un formato estándar para "un montón de datos, firmados, que no se pueden falsificar".
- **Endpoint**: una URL del backend a la que el frontend le pide algo (por ejemplo `GET /favorites` para traer los favoritos).
- **Header `Authorization`**: la forma en la que el frontend le manda el `id_token` al backend en cada pedido. Se ve así: `Authorization: Bearer <el-token-acá>`.

---

## 3. Archivos del frontend y su función

### `frontend/app/api/auth/[...nextauth]/route.js`

Es el archivo más importante de todo el sistema de login. Acá se configura NextAuth: qué proveedor de login se usa (Google), cuánto dura la sesión, y toda la lógica de qué hacer en cada situación.

Tiene dos partes principales:

- **`refreshIdToken(token)`**: una función que le pide a Google un `id_token` nuevo, usando el `refresh_token`. Se usa cuando el token viejo ya venció.
- **`authOptions`**: la configuración completa. Adentro hay dos "callbacks" (funciones que NextAuth llama automáticamente en distintos momentos):
  - **`jwt`**: se ejecuta cada vez que hay que leer o actualizar la sesión. Acá pasan varias cosas — se explican en detalle en la [sección 5](#5-el-flujo-completo-paso-a-paso).
  - **`session`**: arma el objeto de sesión que después usa el resto de la app (`useSession()`), copiando ahí los datos que hacen falta (el `id_token`, si hubo algún error, si aceptó los términos).

### `frontend/middleware.tsx`

Es un archivo especial de Next.js que se ejecuta **antes** de que cargue casi cualquier página. Es como un portero parado en la puerta de la app.

Hoy hace dos cosas:
- Si alguien entra a una página que empieza con `/admin`, chequea que haya sesión **y** que el email coincida con el de la variable `ADMIN_EMAIL`. Si no, lo manda para la home.
- Si alguien entra a `/profile` sin sesión, también lo manda para la home.

El resto de las páginas pasan libremente (no todas necesitan login).

> Importante: este archivo **solo protege páginas de este mismo sitio de Next.js**. No tiene ningún efecto sobre pedidos que se hacen directo al backend (por ejemplo, con `curl` o desde otra herramienta) — esa protección la tiene que dar el backend por su cuenta (ver [sección 4](#4-archivos-del-backend-y-su-función)).

### `frontend/components/layout/Providers.jsx`

Es un componente que envuelve **toda la app** (se usa una sola vez, en el layout principal). Adentro del `SessionProvider` de NextAuth viven cuatro componentes invisibles que corren en segundo plano, todo el tiempo:

- **`AuthErrorHandler`**: mira si la sesión tiene algún error (`session.error`) y, si lo tiene, cierra la sesión automáticamente. Los errores que puede tener son `RefreshTokenError` (no se pudo renovar el token), `UserNotFound` (el usuario ya no existe en la base de datos) y `SignupError` (falló el guardado del usuario la primera vez que se logueó).
- **`RememberMeHandler`**: si el usuario destildó "recordar sesión" al loguearse, este componente hace que la sesión se cierre sola al cerrar la pestaña.
- **`TermsAcceptHandler`**: si el usuario recién se logueó y todavía no tiene registrada la aceptación de términos, llama al backend para guardarla.
- **`FavoritesLoader`**: cuando hay sesión, carga los favoritos del usuario.

El `SessionProvider` también tiene configurado `refetchInterval={5 * 60}`, que quiere decir: **cada 5 minutos, revisar la sesión de nuevo**, aunque el usuario no haga nada. Esto es lo que hace que la app se entere si el token venció o si pasó algo raro, sin esperar a que el usuario cambie de pestaña.

### `frontend/components/layout/AuthModal.jsx`

Es la ventana (modal) que ve el usuario cuando tiene que loguearse. Tiene:
- Una lista corta de para qué sirve tener cuenta (guardar favoritos, dejar reseñas, sugerir lugares).
- Un checkbox de "recordar sesión en este dispositivo" (afecta a `RememberMeHandler`, explicado arriba).
- Un aviso de que al continuar se aceptan los términos y condiciones.
- El botón de "Continuar con Google", que dispara el login.

Antes de llamar a `signIn()`, guarda en el `localStorage` del navegador dos banderas: si el usuario quiere que se recuerde la sesión, y que aceptó los términos — esas banderas las leen `RememberMeHandler` y `TermsAcceptHandler` después.

### `frontend/components/layout/Navbar.jsx` y `frontend/components/layout/HeroHeader.jsx`

Son las barras de navegación (una fija arriba, otra que aparece en la portada). No manejan login por su cuenta — cuando el usuario aprieta "Iniciar sesión" en cualquiera de las dos, simplemente abren el `AuthModal` descrito arriba.

### `frontend/types/next-auth.d.ts`

No tiene lógica — es un archivo de **tipos de TypeScript**. Le dice al editor de código y al compilador qué campos extra tienen el `token` y la `session` de NextAuth en este proyecto (que por defecto no existen en la librería): `id_token`, `error`, `termsAcceptedAt`, `lastChecked`. Sirve para que el resto del código no tire errores de tipos al usar esos campos.

---

## 4. Archivos del backend y su función

### `backend/auth.py`

Es el archivo central de autenticación del backend — el "portero" que revisa el `id_token` en cada pedido. Define varias funciones, de menor a mayor exigencia:

- **`get_current_user`**: recibe el header `Authorization`, y si hay un token, lo manda a verificar con Google (`id_token.verify_oauth2_token`). Google confirma que la firma es válida, que no venció, y que fue emitido para esta app en particular (comparando contra `GOOGLE_CLIENT_ID`). Si todo está bien, devuelve los datos del usuario (email, nombre, etc.). Si algo falla, o si no vino ningún token, devuelve `None` (nada) — **no bloquea el pedido por su cuenta**, solo informa si hay usuario o no.
- **`get_current_user_required`**: usa la función anterior, y si no hay usuario, corta el pedido con un error 401 ("No autenticado"). Es la que usan casi todos los endpoints que necesitan que el usuario esté logueado.
- **`is_admin`**: compara el email del usuario contra la variable de entorno `ADMIN_EMAIL`.
- **`get_current_admin_user`**: como `get_current_user_required`, pero además exige que `is_admin` dé verdadero. Si no, corta con un error 403 ("No autorizado"). La usan los endpoints que solo puede tocar el administrador (aprobar spots, verlos todos, borrarlos).

Este archivo también valida, apenas arranca el servidor, que la variable `GOOGLE_CLIENT_ID` esté configurada — si falta, el backend ni siquiera arranca (para evitar que la app quede corriendo en un estado inseguro).

### `backend/routers/upsert.py`

Tiene dos endpoints relacionados con "dar de alta" al usuario:

- **`POST /users/upsert`**: se llama automáticamente la primera vez que alguien se loguea (lo dispara `route.js`, del lado del frontend). Busca si ya existe un usuario con ese email en la base de datos; si existe, actualiza su nombre/foto; si no existe, lo crea.
- **`PATCH /users/me/terms`**: guarda la fecha en la que el usuario aceptó los términos y condiciones.

### `backend/routers/users.py`

Tiene los endpoints para que un usuario consulte o borre su propia cuenta:

- **`GET /users/me`**: devuelve el `id` del usuario si existe. Si el token es inválido, da 401. Si el token es válido pero no hay usuario con ese email en la base, da 404. Esta diferencia (401 contra 404) es importante — se explica en detalle en [`errores-conocidos/auth-orden-verificacion.md`](../errores-conocidos/auth-orden-verificacion.md).
- **`DELETE /users/me`**: borra la cuenta y todo lo asociado (reseñas, favoritos).

### El resto de los routers (`favorites.py`, `reviews.py`, `spots.py`, etc.)

No tienen lógica de autenticación propia — todos importan y usan las funciones de `auth.py` explicadas arriba, según lo que necesite cada endpoint:

- Los que necesitan que **cualquier usuario logueado** pueda usarlos (crear una reseña, marcar un favorito, sugerir un spot nuevo) usan `get_current_user_required`.
- Los que solo puede usar el **administrador** (aprobar/rechazar spots, verlos todos, borrar cualquiera) usan `get_current_admin_user`.
- Un caso especial es `spots.py`, que tiene una función propia llamada `get_owned_spot_or_admin`: para acciones donde tanto el dueño de un spot como el administrador deberían poder actuar (por ejemplo, editar las fotos de un spot) — revisa si el usuario es el administrador **o** si su email coincide con el dueño registrado del spot.

Un detalle de diseño: como los endpoints de FastAPI resuelven estas verificaciones **antes** de ejecutar el código de la función, si el usuario no cumple lo que se pide, el endpoint ni siquiera llega a tocar la base de datos — corta antes, con el error correspondiente (401 o 403).

---

## 5. El flujo completo, paso a paso

### Primer login

1. El usuario aprieta "Continuar con Google" en el `AuthModal`.
2. Se abre la pantalla de Google para elegir la cuenta y dar permiso.
3. Google redirige de vuelta a Rumbo con la prueba del login.
4. NextAuth (en `route.js`) recibe esa prueba, y en el callback `jwt` — específicamente en la parte que se ejecuta solo la primera vez (`if (account)`) — llama a `POST /users/upsert` en el backend, para crear (o actualizar) al usuario en la base de datos.
5. Se arma la sesión con el `id_token`, el `access_token`, el `refresh_token` y la fecha de vencimiento, y se guarda todo en la cookie del navegador.
6. Del lado del frontend, `TermsAcceptHandler` (en `Providers.jsx`) detecta que el usuario recién se logueó y todavía no aceptó los términos formalmente en el backend, y llama a `PATCH /users/me/terms` para registrarlo.

### Uso normal (con sesión ya iniciada)

Cada vez que el frontend necesita hacer algo que requiere identificar al usuario (marcar un favorito, cargar el perfil, etc.), toma el `id_token` guardado en la sesión y lo manda en el header `Authorization` del pedido al backend. El backend lo valida de cero con `get_current_user`/`get_current_user_required`, como se explicó en la [sección 4](#4-archivos-del-backend-y-su-función).

### Revisiones periódicas

Cada 5 minutos (por el `refetchInterval` configurado en `Providers.jsx`), o cada vez que el usuario vuelve a la pestaña, NextAuth vuelve a ejecutar el callback `jwt`. Ahí se revisan, en este orden:

1. **¿El `id_token` ya venció?** Si venció, se pide uno nuevo con `refreshIdToken()`, usando el `refresh_token`. Esto pasa en silencio, sin que el usuario note nada.
2. **¿El usuario todavía existe en la base de datos?** Cada 10 minutos como máximo, se le pregunta al backend (`GET /users/me`). Si el backend confirma que no existe (404), se cierra la sesión.

### Cierre de sesión

Puede pasar por tres motivos:
- El usuario lo pide expresamente (botón de cerrar sesión).
- `AuthErrorHandler` detecta un error en la sesión (token no se pudo renovar, usuario borrado, o falló el alta inicial) y cierra la sesión sola.
- El usuario destildó "recordar sesión" y cierra la pestaña (`RememberMeHandler`).

---

## 6. Cuánto dura la sesión

Hay **tres relojes distintos** corriendo en paralelo, y es importante no confundirlos:

| Qué | Cuánto dura | Quién lo maneja |
|---|---|---|
| `id_token` de Google (el que valida el backend en cada pedido) | Alrededor de 1 hora | Se renueva solo, en segundo plano |
| `refresh_token` de Google | No vence, salvo que el usuario le saque el acceso a Rumbo desde su cuenta de Google | Google |
| Cookie de sesión de NextAuth (lo que guarda el navegador) | 7 días | NextAuth (`route.js`, configuración `session.maxAge`) |

En la práctica: mientras la cookie de NextAuth siga viva (hasta 7 días), el `id_token` se va renovando solo cada una hora aproximadamente, sin que el usuario tenga que volver a loguearse. Recién a los 7 días (o si algo falla en el medio) hace falta un login nuevo.

---

## 7. Qué endpoints piden login y cuáles no

**Sin login (público)**: casi todos los `GET` de lectura — listado y detalle de spots, rutas, sectores, servicios de kayak/surf, reseñas de un spot, categorías, amenities.

**Con login (`get_current_user_required`)** — cualquier usuario logueado, sin distinción:
- Crear un spot y todo lo que se carga con él (rutas, sectores, camping, glamping, motorhome, experiencias, amenities).
- Favoritos (ver, agregar, sacar).
- Reseñas propias (ver las mías, crear, borrar) — de spots, kayak y surf.
- Subir fotos a un spot.
- Ver/borrar la cuenta propia, ver mis spots.

**Solo administrador (`get_current_admin_user`)**:
- Ver todos los spots (incluidos los no aprobados).
- Aprobar o desaprobar un spot.
- Borrar un spot.

**Administrador o dueño del spot (`get_owned_spot_or_admin`)**:
- Editar los datos de un spot.
- Cambiar la foto principal.
- Borrar una foto.

---

## 8. Variables de entorno involucradas

| Variable | Dónde se usa | Para qué |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Frontend y backend | Identifica a la app de Rumbo ante Google. El backend la usa para confirmar que el token fue emitido para esta app y no para otra. |
| `GOOGLE_CLIENT_SECRET` | Frontend (`route.js`) | Necesaria para pedirle tokens nuevos a Google (login inicial y refresh). |
| `ADMIN_EMAIL` | Frontend (`middleware.tsx`) y backend (`auth.py`) | El email que se considera "administrador". Están separadas: hay que configurarla en los dos lados. |
| `NEXT_PUBLIC_API_URL` | Frontend | La URL del backend, para saber a dónde mandar los pedidos. |
| `NEXTAUTH_SECRET` | Frontend | No aparece explícitamente en el código porque la lee sola la librería NextAuth — la necesita para firmar y cifrar la cookie de sesión. Tiene que estar configurada igual. |
