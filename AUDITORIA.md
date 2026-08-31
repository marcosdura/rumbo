# Auditoría del proyecto — seguimiento

Lista de hallazgos de un scan exhaustivo del proyecto (seguridad, modularización,
eficiencia, UI/UX, negocio). Cada vez que se resuelve un ítem, se marca acá con
el commit que lo resolvió. No se borra nada de la lista al resolverlo — así queda
como registro de qué se decidió atacar y qué no.

---

## 01 — Seguridad

- [x] **IDOR generalizado** — sub-recursos de spots (glamping/routes/sectors/climbingroutes/kayak/surfschools) sin comparar `spot.owner_email` contra el usuario del token.
      → `4367eac`
- [x] **Cloudinary `public_id` predecible + firma sin validar dueño del spot**
      → `9f92ad2`
- [x] **SSRF sin autenticación en `/api/resolve-url`**
      → `b04e1a4`
- [x] **Falta rate limiting en varios endpoints de escritura** (categories, amenities, routes, sectors, climbingroutes, glamping)
      → `b537e6d`
- [x] **Borrar la cuenta no borraba los spots del usuario** — quedaban huérfanos y públicos para siempre; ahora se desactivan y aparecen en una pestaña del admin para poder contactar al dueño.
      → `a786e84`
- [x] **Sin validación server-side de tipo/tamaño de archivo al subir imágenes** — `allowed_formats` ahora viaja firmado hacia Cloudinary (no bypasseable desde el cliente) + validación de UX en `StepImagenes.tsx`.
      → `45e73ff`
- [x] **`DELETE FROM spots` crudo sin cascadas** — rompía con `IntegrityError` en cualquier spot con contenido asociado. `cascade="all, delete-orphan"` en los modelos, sin migración de base de datos.
      → `d878270`
- [x] **Sin `max_length` en texto libre / sin límite de body** — `Field(max_length=...)` en los schemas de entrada + middleware de 1MB en `main.py`.
      → `05b0163`
- [ ] **El dueño puede editar un spot ya aprobado sin volver a pasar por revisión** (riesgo de "bait-and-switch")
- [x] **`get_remote_address` sin confirmar proxy del hosting** — investigado a fondo: sin `--proxy-headers` en uvicorn (no hay Procfile en el repo, no confirmable), `request.client.host` es la IP del proxy de Railway, no la del usuario — muy probable que todos compartieran el mismo balde de rate limit. Se arregló leyendo `X-Forwarded-For` directo del header, sin depender de la config de uvicorn.
      → `d09ecfb`
- [x] **El `sub` de Google se expone en cada review pública** — reemplazado por `is_mine: bool` calculado server-side (auth opcional), el único uso real era decidir si mostrar "Eliminar".
      → `d09ecfb`
- [x] **`GET /spots/check-name` sin rate limit** — `@limiter.limit("20/minute")`, generoso porque ya está debounced del lado del frontend.
      → `d09ecfb`
- [x] **Dependencia `openai` sin uso + `package.json` suelto en `backend/`** — confirmado sin uso real, `openai` fuera de `requirements.txt`; `package.json`/`package-lock.json` (declaraban `cloudinary` de Node en la carpeta del backend Python) borrados.
      → `d09ecfb`

## 02 — Modularización

- [x] **Reviews implementadas 3 veces** (spots/kayak/surf) → router genérico parametrizado
      → `c8bc087`
- [x] **`get_db()` reimplementado en 15 routers** → import compartido de `database.py`
      → `c8bc087`
- [x] **`generate_slug()` copiado 3 veces** → `backend/slugs.py`
      → `c8bc087`
- [x] **`camping.py` código muerto** (no montado en `main.py`, duplicado activo en `spots.py`) → borrado
      → `c8bc087`
- [x] **`get_sectors_by_spot` definido dos veces en `spots.py`** — la ruta sin prefijo `/spots` (dead code, sin uso en el frontend, confirmado por grep) se borró; queda solo la correcta.
      → `b4896c4`
- [x] **`kayak.py` y `surfschools.py` eran el mismo router con nombres cambiados** — unificados en `operator_router_factory.py`, mismo patrón que reviews.
      → `b4896c4`
- [x] **5 `FilterDrawer` del frontend eran el mismo componente repetido** — el "shell" (estado, animación, JSX de overlay/panel/header/footer, CSS) pasó a `FilterDrawerShell.tsx` compartido. El contenido de cada filtro en sí queda igual que estaba (normalizar los 5 `lib/*-filters.ts` para unificar también eso es un refactor aparte, más grande, quedó fuera a propósito).
      → `323c7f3`
- [x] **`KayakImageGallery.jsx` y `SurfImageGallery.jsx` 100% idénticos** — fusionados en `PhotoLightbox.jsx`, un solo componente, ambos call sites actualizados.
      → `cb66ce7`
- [x] **Sin cliente API centralizado en el frontend** — `frontend/lib/api.ts` (`api.get/post/patch/put/del`, URL base + auth + Content-Type + querystring + `ApiError` con el detail del backend + `totalCount` de `X-Total-Count`, passthrough de `cache`/`next` para Server Components). Los 98 `fetch()` de los 29 archivos que hablaban con el backend propio se migraron; `lib/uploadImage.ts`, `api/resolve-url/route.ts` y `LocationPicker.jsx` quedaron afuera a propósito (hablan con Cloudinary/URLs externas, no con nuestro backend).
      → `2fa764e`, `c710209`, `38723ce`, `ec12e56`, `86c7a8a`, `7a97768`
- [x] **Componentes de 300-1000+ líneas** — los 5 bajaron de tamaño partiendo JSX/CSS/tabs en subcomponentes, sin tocar estilos ni comportamiento: `AgregarLugar.tsx` 1016→836 (header/overlay/submits especiales a archivos propios), `admin/page.tsx` 621→238 (tabs + modales), `SearchPageContent.tsx` 645→457 (CSS a `search.css`), `profile/page.tsx` 513→222 (secciones), `dashboard/spots/[id]/page.tsx` 560→302 (tabs; el estado editable se dejó a propósito en el padre — los tabs se montan/desmontan y moverlo hubiera perdido cambios sin guardar al cambiar de pestaña).
      → `8727727`, `29e4e20`, `0124097`, `f4a0a9e`, `55606e6`

## 03 — Eficiencia

- [x] **Ningún listado del backend estaba paginado** — `/spots` y reviews paginados con `X-Total-Count`; `/spots/pins` nuevo, sin paginar, para el mapa. (`/admin/spots` quedó explícitamente afuera — bajo tráfico, no lo justificaba)
      → `9dfec4f`, fix de Postgres en `7c2eff1`
- [x] **Faltaban índices en columnas de filtro/orden/FKs**
      → `9dfec4f`
- [x] **`get_spot_by_slug` no trae `climbing_sectors`/`kayak_detail`/`surf_schools` con `selectinload`** — de paso apareció un bug real: `camping_detail` se accedía sin eager-load en ese mismo endpoint y en su gemelo `get_spot` (N+1 en cada spot de Camping). Se agregaron las 4 relaciones a `selectinload()` en ambos endpoints y los 3 campos nuevos a `SpotResponse` (no existían, por eso el frontend estaba forzado a pedirlos aparte). `SpotDetails.jsx` ahora usa `spot.routes`/`spot.climbing_sectors`/`spot.kayak_detail`/`spot.surf_schools` embebidos en vez de 4 fetches sueltos; el único que queda (reviews-summary) se cancela con `AbortController`.
      → `896c57c`, `7d60795`
- [x] **17 archivos con `<img>` crudo en vez de `CldImage`/`next/image`** — el alcance real eran 5: `RumboLogo.png` (2 archivos) a `next/image`, y las fotos de kayak/surf (3 archivos, guardadas como URL completa de Cloudinary en vez de `cloudinary_public_id`) a `CldImage` extrayendo el public_id de la URL. Los otros 12 quedaron afuera a propósito: 5 son avatares de Google (requieren `remotePatterns` + `referrerPolicy` sin confirmar en `next/image`) y 4 son previews `blob:` durante la subida (URLs locales, no remotas — imposibles de migrar).
      → `3d7fa9b`
- [ ] **Cero cache para `/categories` y `/amenities`** — investigado y descartado sin tocar código: `/categories` no la llama nadie del frontend (la UI usa constantes hardcodeadas), `/amenities` solo se llama al publicar un lugar con amenities, no en cada carga de página. No hay tráfico real que cachear hoy.
- [x] **Fetch de filtros de búsqueda sin `AbortController`** — `AbortController` compartido entre el efecto principal y "Cargar más" en `SearchPageContent.tsx`: cambiar de filtro rápido cancela el fetch anterior en vez de dejar que una respuesta vieja pise el estado nuevo. El "debounce" del ítem original no aplicaba: no hay ningún input de texto en este componente que dispare fetch por tecla (los filtros aplican solo al tocar "Aplicar filtros"), así que no había dónde engancharlo sin inventar un caso de uso que no existe.
      → `7300caa`
- [x] **Doble fetch sin `cache()` en `/spots/[slug]`** — `generateMetadata` y la página comparten un solo `getSpotBySlug` envuelto en `cache()` de React (patrón documentado por Next para este caso exacto), en vez de pedir el mismo spot dos veces.
      → `ffb0ef9`

## 04 — UI / UX

- [x] **Home y Búsqueda quedaban en loading infinito si el backend fallaba** — estado de error + botón "Reintentar"
      → `bb053d1`
- [x] **Confirmaciones destructivas inconsistentes** — borrar review propia no tenía ninguna confirmación (ni siquiera en la pantalla de "Mis reviews", que tenía su propio `handleDelete` separado). Ahora usa un modal propio (`ConfirmModal`), mismo estilo visual que el resto del sitio, no el `confirm()` nativo del navegador.
      → `cc45ff7`
- [x] **Sin design system compartido** — resuelto en dos etapas. Primero la base: `globals.css` suma 5 tokens de color núcleo (`--primary`, `--primary-dark`, `--border`, `--muted`, `--danger` + `--shadow-card`), antes hardcodeados sin ningún token en 78 archivos (ej. `#2d6a4f` solo, 180 veces en 61 archivos) — mapeados también al `@theme` de Tailwind v4. `.fade-up`/`@keyframes fadeUp`, duplicado en 9 archivos con 2 variantes de timing casi idénticas, pasa a una sola definición global. El `card` (fondo/borde/radio/sombra) que vivía repetido byte a byte entre `profile/styles.ts` y `dashboard/spots/[id]/styles.ts` ahora es un solo `frontend/lib/theme.ts`. Después, migración completa: los 78 archivos con alguno de los 5 hex núcleo hardcodeado (481 ocurrencias) se migraron a los tokens en 8 slices agrupados por feature (globales sueltos, búsqueda/listado, spot-detail, agregar-lugar núcleo+ui, agregar-lugar steps, admin, perfil+dashboard, páginas top-level/detalle) — `grep` final confirma cero hex núcleo fuera de `globals.css` en todo `frontend/`.
      → `37abe12`, `f54953b`, `f9d0e9b` (base) — `99efce2`, `4150d4f`, `82c8604`, `8a3be0d`, `bcdeb8c`, `bb84f26`, `358a56b`, `4870c5e` (migración completa, 8 slices)
- [ ] **Fuentes de marca (Playfair Display, DM Sans) nunca pasan por `next/font`** — `@import` repetido en 19 archivos, FOUC. Investigado al evaluar el design system: arreglarlo bien no es solo mover el `@import` a `next/font` — `next/font` con `variable` genera un nombre de familia hasheado, así que sacar el `@import` sin migrar cada `font-family: 'Playfair Display'`/`'DM Sans'` literal (~50+ apariciones, inline styles y bloques `<style>`) rompería la tipografía de todo el sitio (caería al fallback genérico). Queda pendiente, con el riesgo ya mapeado.
- [ ] **El panel admin se siente un producto visual distinto al resto del sitio**
- [ ] **`ReviewsSection.jsx` sigue confundiendo error de red con "no hay reviews"** — `catch {}` vacíos en `loadReviews`/`loadMoreReviews`/`handleSubmit` (solo se tocó `handleDelete` al agregar el modal de confirmación)
- [ ] **Ningún modal tiene focus trap, `role="dialog"` ni cierre con Escape** — incluye el `ConfirmModal` nuevo, no se ató a ese arreglo
- [ ] **`StarPicker` no usable solo con teclado**
- [ ] **Contraste dudoso en textos secundarios + checkbox de términos no es un `<input>` nativo**
- [ ] **Tres mecanismos distintos de "aceptar términos" coexistiendo** (checkbox en AuthModal / página onboarding/terms / auto-accept silencioso en AgregarLugar)
- [ ] **No es instalable como PWA** pese a que ya existen los íconos necesarios

## 05 — Negocio / producto

- [x] **Cero analytics** — Google Analytics 4 instrumentado (login, favorito, review, agregar-lugar, búsqueda)
      → `ac47866`
- [x] **SEO: cero JSON-LD + URLs numéricas en surf/kayak** — `Place`/`LocalBusiness` + `AggregateRating`, slugs amigables (`/surf/nombre-id`, sin migración de base de datos)
      → `eac584e`, `a2d24a1`
- [ ] **Sin ningún camino de monetización** — el modelo de datos ya tiene los ganchos (email/whatsapp/instagram en spots, surf, kayak), falta la capa de pago y destacados
- [ ] **Cero retención activa** — sin email, sin notificaciones, sin newsletter
- [ ] **Contenido sin moderación real ni forma de reportar** — solo existe `is_approved` booleano, sin motivo de rechazo ni endpoint de report/flag
- [ ] **Surf y Kayak rompen el patrón genérico de categoría** (estructural) — contacto y fotos duplicados en vez de reusar `SpotDB`/`SpotImage`, reviews propias en vez del sistema genérico
