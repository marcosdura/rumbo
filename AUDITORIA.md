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
- [ ] **`get_remote_address` sin confirmar la configuración de proxy del hosting** — depende de la topología de Railway, no resoluble solo desde el repo
- [ ] **El `sub` de Google se expone en cada review pública** (bajo impacto, dato de más)
- [ ] **`GET /spots/check-name` público sin rate limit** — enumeración de nombres (bajo impacto)
- [ ] **Dependencia `openai` sin uso real + `package.json` suelto en `backend/`** (limpieza, no vulnerabilidad)

## 02 — Modularización

- [x] **Reviews implementadas 3 veces** (spots/kayak/surf) → router genérico parametrizado
      → `c8bc087`
- [x] **`get_db()` reimplementado en 15 routers** → import compartido de `database.py`
      → `c8bc087`
- [x] **`generate_slug()` copiado 3 veces** → `backend/slugs.py`
      → `c8bc087`
- [x] **`camping.py` código muerto** (no montado en `main.py`, duplicado activo en `spots.py`) → borrado
      → `c8bc087`
- [ ] **`get_sectors_by_spot` definido dos veces en `spots.py`** (línea con ruta sin prefijo `/spots` + la correcta) — encontrado al hacer la limpieza de arriba, no se llegó a tocar
- [ ] **5 `FilterDrawer` del frontend son el mismo componente repetido** (Trekking/Kayak/Surf/Climbing/Camping, ~330-350 líneas c/u)
- [ ] **`kayak.py` y `surfschools.py` son el mismo router con nombres cambiados** — candidato a la misma factory que reviews
- [ ] **`KayakImageGallery.jsx` y `SurfImageGallery.jsx` 100% idénticos**
- [ ] **Sin cliente API centralizado en el frontend** (21+ archivos con `NEXT_PUBLIC_API_URL` inline, 26 con `fetch()` directo)
- [ ] **Componentes de 300-1000+ líneas** mezclando fetch/estado/estilos (`AgregarLugar.tsx`, `admin/page.tsx`, `SearchPageContent.tsx`, `profile/page.tsx`, `dashboard/spots/[id]/page.tsx`)

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
