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
- [ ] **`get_spot_by_slug` no trae `climbing_sectors`/`kayak_detail`/`surf_schools` con `selectinload`** — el frontend compensa con fetches sueltos sin `AbortController`
- [ ] **17 archivos con `<img>` crudo en vez de `CldImage`/`next/image`**
- [ ] **Cero cache para `/categories` y `/amenities`** (catálogos casi estáticos, se golpean en cada request)
- [ ] **Fetch de filtros de búsqueda sin `AbortController` ni debounce** (race conditions al cambiar de filtro rápido)
- [ ] **Doble fetch sin `cache()` en `/spots/[slug]`** (`generateMetadata` + página piden lo mismo por separado)

## 04 — UI / UX

- [x] **Home y Búsqueda quedaban en loading infinito si el backend fallaba** — estado de error + botón "Reintentar"
      → `bb053d1`
- [x] **Confirmaciones destructivas inconsistentes** — borrar review propia no tenía ninguna confirmación (ni siquiera en la pantalla de "Mis reviews", que tenía su propio `handleDelete` separado). Ahora usa un modal propio (`ConfirmModal`), mismo estilo visual que el resto del sitio, no el `confirm()` nativo del navegador.
      → `cc45ff7`
- [ ] **Sin design system compartido** — cada página repite su propio bloque de estilos (`.fade-up`, paleta, radios, sombras)
- [ ] **Fuentes de marca (Playfair Display, DM Sans) nunca pasan por `next/font`** — `@import` repetido por página, FOUC
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
