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
- [x] **El dueño puede editar un spot ya aprobado sin volver a pasar por revisión** (riesgo de "bait-and-switch") — **decisión pendiente, no es falta de implementación**. Verificado: `dashboard/spots/[id]` guarda con `PATCH /admin/spots/{id}` y el spot queda con `is_approved` en `true` sin revisión. El escenario es publicar algo inocuo, esperar la aprobación y después cambiarle el contenido. Falta decidir el criterio antes de codear: ¿cualquier edición vuelve a "pendiente", o solo las de campos sensibles (nombre, descripción, fotos) y no las de contacto/precio? ¿Se despublica mientras espera, o sigue visible con la versión aprobada? Eso cambia por completo qué hay que construir.
      **Resuelto así:**
      - *Criterio:* a revisión van nombre, descripción y fotos **agregadas**. Al instante: contacto, precio, temporada, acceso, transporte, borrar fotos y elegir la principal. Ubicación (lat/lng) y departamento: solo el admin (el endpoint los ignora si vienen del dueño). Admin y spots todavía no aprobados editan directo, como hoy.
      - *Mientras espera:* sigue visible la versión aprobada. El pedido vive en una tabla aparte (`spot_change_requests`, JSON con antes/después), un solo pendiente por spot (índice único parcial + 409).
      - *Dueño:* un solo "Guardar" para info + fotos nuevas, con modal que separa qué va a revisión y qué se aplica ya. Puede cancelar el pedido (las fotos nuevas se destruyen en Cloudinary). Límite de 10 fotos: si aprobadas + nuevas > 10 se bloquea con aviso de cuántas borrar, sin recortar en silencio (chequeado en el front, al crear el pedido y al aprobar). Ve el resultado (aprobado / rechazado + motivo) en su dashboard hasta cerrarlo, y una etiqueta "cambio en revisión" en `/profile`.
      - *Admin:* pestaña "Cambios pendientes" con contador, antes/después y miniaturas. Todo o nada: Aprobar, o Rechazar con comentario del motivo. Aviso si el valor actual cambió desde que se hizo el pedido.
      - *Bordes:* borrar el spot o la cuenta cancela el pedido y destruye sus fotos; desaprobar el spot vuelca el pedido sobre el spot (igual se revisa entero); nombre repetido se valida al pedir y al aprobar; el slug no cambia con el nombre; si al aprobar no hay foto principal, la primera nueva pasa a serlo; sin pedido si no cambió nada (con trim).
      - *Prerrequisito:* el dueño podía sobrescribir en Cloudinary una foto ya aprobada (public_id predecible `Categoria/Nombre/NombreN` + Cloudinary sobrescribe por defecto + `can-upload` solo miraba otros spots). Se firma `overwrite=false` y los public_id nuevos pasan a `spots/{id}/{aleatorio}`.
      - *Orden:* 1) agujero de Cloudinary → 2) backend → 3) dashboard del dueño → 4) panel admin.
      - *Encontrado en el camino:* `POST /images/spots/{id}` dejaba al dueño publicar fotos directo en un spot aprobado (salteaba todo lo anterior) — ahora solo admin o spot no aprobado. El PATCH recibía un `dict` crudo sin límite de largo — ahora `SpotEditRequest`. Borrar foto / elegir principal en el dashboard ignoraban errores y mostraban el cambio igual.
      → `1f3c714` (Cloudinary), `92e762b` (backend), `7d0a27c` (dashboard), `f001118` (admin)
- [x] **El dueño puede agregar sub-recursos a un spot aprobado sin revisión** — mismo problema que el ítem anterior, por otro lado: los `POST` de experiencias, rutas, sectores, unidades de glamping, amenities y categorías aceptan al dueño sobre un spot ya aprobado. La UI del dashboard no lo ofrece, pero la API sí. Quedó fuera del trabajo de edición de spots a propósito.
      **Resuelto así:** la idea no es prohibir agregar cosas sino que pasen por revisión.
      - *Quién:* experiencias, unidades de glamping, rutas de trekking, escuelas de surf y kayak → solo el dueño. Sectores y vías de escalada → cualquier usuario logueado puede sugerirlos en un spot ajeno. Atributos de lo que ya existe (comodidades del glamping, datos de camping/motorhome/trekking, amenities) → el dueño, al instante. Categorías secundarias de un spot aprobado y catálogo global (`POST /categories`, `POST /amenities`, que hoy acepta a cualquier logueado) → solo admin.
      - *Revisión:* cada agregado se aprueba o rechaza por separado (sin "uno a la vez", que bloquearía a la comunidad). Columna `is_approved` en las 7 tablas (true para todo lo existente) + tabla `contributions` (quién, qué, estado, motivo, aviso cerrado). Rechazar borra el elemento (y las fotos de surf/kayak); el registro queda para que el autor vea el motivo. Un sector sugerido se aprueba junto con sus vías. Una experiencia pendiente no suma su categoría al spot hasta aprobarse. El autor puede retirar un aporte pendiente. Admin y spot no aprobado: directo.
      - *Lecturas:* ~20 lecturas públicas filtran pendientes (página del spot, rutas/sectores por slug, listados y sitemap de surf/kayak, stats de sectores, filtros de búsqueda, reseñas de surf/kayak), con un test cada una.
      - *Encontrado:* los 5 flujos de agregar lugar que suman a un spot existente (trekking, sector, vía, surf, kayak) listan todos los spots aprobados pero el backend exige ser dueño desde `4367eac` → hoy dan 403 a cualquiera que no sea el dueño. Borrar un spot no destruye las fotos de surf/kayak en Cloudinary.
      - *Orden:* 1) migración + catálogo/categorías solo admin → 2) crear/revisar → 3) lecturas → 4) agregar lugar → 5) dashboard (experiencias y glamping) → 6) /profile "Tus aportes" + admin.
      - *Lecturas, cómo quedó:* en vez de filtrar a mano, un filtro global (`models.hide_pending_contributions`, `with_loader_criteria` en `do_orm_execute`) oculta los pendientes en toda consulta, join y relación; las pocas excepciones (admin, autor, borrados) piden `include_pending=True`. `tests/test_pending_reads.py` recorre cada lectura pública.
      - *Surf y kayak abiertos:* lo que acá quedó para el dueño se resolvió en "No hay forma de llegar a cargar contenido" (parte 3): las playas y lagunas son lugares públicos y cualquier usuario suma su escuela o servicio a cualquiera de ellas, con revisión (`OPERATOR_KINDS`, `tests/test_venues.py`). No hace falta cargar la playa de nuevo.
      → `2fdf680` (migración + catálogo), `99a98bf` (crear/revisar), `365ce89` (lecturas), `1437692` (agregar lugar), `cb0c987` (dashboard), `453d2a3` (/profile + admin)
- [x] **`get_remote_address` sin confirmar proxy del hosting** — investigado a fondo: sin `--proxy-headers` en uvicorn (no hay Procfile en el repo, no confirmable), `request.client.host` es la IP del proxy de Railway, no la del usuario — muy probable que todos compartieran el mismo balde de rate limit. Se arregló leyendo `X-Forwarded-For` directo del header, sin depender de la config de uvicorn.
      → `d09ecfb`
- [x] **El `sub` de Google se expone en cada review pública** — reemplazado por `is_mine: bool` calculado server-side (auth opcional), el único uso real era decidir si mostrar "Eliminar".
      → `d09ecfb`
- [x] **`GET /spots/check-name` sin rate limit** — `@limiter.limit("20/minute")`, generoso porque ya está debounced del lado del frontend.
      → `d09ecfb`
- [x] **Dependencia `openai` sin uso + `package.json` suelto en `backend/`** — confirmado sin uso real, `openai` fuera de `requirements.txt`; `package.json`/`package-lock.json` (declaraban `cloudinary` de Node en la carpeta del backend Python) borrados.
      → `d09ecfb`

- [x] **No hay forma de llegar a cargar contenido desde la app** — el único link a `/agregar-lugar` estaba en el panel admin: ni el Navbar, ni la home, ni el perfil, ni la página del spot. La página del spot no ofrece sumar nada (y las secciones vacías no se muestran), el dueño no tiene acceso a "Administrar" desde su spot, y agregar-lugar no acepta llegar con un spot ya elegido.
      **Resuelto así:**
      - *Parte 1, accesos:* "Agregar lugar" en el Navbar; en /profile "Tus lugares" y "Tus aportes" siempre visibles con estado vacío; la pestaña de experiencias del dashboard solo en Camping/Glamping/Motorhome (como agregar-lugar y la página pública); links directos a agregar-lugar (`?sumar=sector&spot=12`) que saltan al formulario, vuelven al spot y sobreviven al login; en la página del spot "Administrar" para el dueño, "Sugerir un sector/vía" en escalada (aunque no haya sectores), "Agregar una ruta" para el dueño de trekking, "Sumar tu escuela/servicio" en surf y kayak; aviso al autor de sus aportes pendientes en ese spot.
      - *Parte 2, borrar:* la pestaña de contenido del dashboard lista todo (rutas, sectores con vías, experiencias, glamping) con lo pendiente marcado y permite borrar; endpoints de borrado que faltan para rutas, sectores, vías, surf y kayak (con sus fotos).
      - *Parte 3, escuelas con dueño propio:* las playas y lagunas (spots de Surf/Kayak) son lugares públicos que solo edita el admin (regla por categoría, sin migración de datos); cada escuela de surf o servicio de kayak tiene `owner_email` (migración 0004; vacío = admin) y la suma cualquier usuario, que pasa a ser su dueño, con revisión; si la playa no existe se sugiere junto con la escuela y queda a nombre del admin; dashboard de escuela con la misma revisión que los spots (nombre, descripción y fotos a revisión; contacto, clases, precio y temporada al instante), generalizando los pedidos de cambio; "Tus escuelas" en /profile. Las escuelas y kayaks actuales son de prueba: no se migran dueños.
      - *Encontrado en el camino:* las fotos de escuelas y kayaks se guardaban como cualquier URL que mandara el cliente (ahora solo de Cloudinary y con el formato de esa playa); el alta de kayak se tragaba los errores; `GET /routes/{id}` devolvía 500 para un id inexistente; borrar un spot no destruía las fotos de surf/kayak.
      → parte 1: `afe14e4` (Navbar), `00c0b8a` (perfil), `47f85eb` (experiencias solo alojamientos), `88c4be0` (links directos), `57f3f18` (página del spot) — parte 2: `d2fccb0` (borrados), `cc24674` (dashboard) — parte 3: `75285ff` (playas y dueños, migración 0004), `46ab292` (pedidos de cambio de escuelas, 0005), `c617fb0`, `1a42316` (sumar escuela), `28ee4db` (dashboard de escuela y "Tus escuelas"), `63ed077` (admin)

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
- [x] **Cero cache para `/categories` y `/amenities`** — cerrado sin cambios (se retoma si hace falta). Investigado y descartado sin tocar código: `/categories` no la llama nadie del frontend (la UI usa constantes hardcodeadas), `/amenities` solo se llama al publicar un lugar con amenities, no en cada carga de página. No hay tráfico real que cachear hoy.
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
- [x] **Fuentes de marca (Playfair Display, DM Sans) nunca pasan por `next/font`** — `app/layout.tsx` ahora las carga con `next/font/google` (como fuentes variables, mismo patrón que Geist/Geist Mono/Nunito), expuestas como `var(--font-playfair-display)`/`var(--font-dm-sans)`. Se eliminó el `@import` a Google Fonts duplicado en 19 archivos y se migraron los 67 literales `'Playfair Display'`/`'DM Sans'` (bloques `<style>` kebab-case y `fontFamily` inline camelCase) en 42 archivos a las variables, en 6 slices agrupados por feature (fundación, componentes globales/UI, spots listado/búsqueda, spot-detail, admin/perfil/dashboard, páginas top-level/detalle) — `grep` final confirma cero `fonts.googleapis.com` ni literales de fuente fuera de `next/font` en todo `frontend/`.
      → `54b2452` (fundación) — `717295b`, `691047c`, `575a7ad`, `e0211ad`, `aab7fdd` (migración, slices 1-5)
- [x] **El panel admin se siente un producto visual distinto al resto del sitio** — era la única página autenticada sin el `<Navbar />` compartido (tenía su propia `.admin-nav`) y la única sin ningún `<h1>` ni una línea en Playfair. Ahora usa `<Navbar />` + header al estilo de `dashboard/spots/[id]` (h1 Playfair, Pill "modo admin", "+ Agregar lugar"). Además: `.spot-row` pasa a los valores de `card` (radio 20 + sombra, antes 16 sin sombra); tabs, filtros e inputs pasan a `tab()`/`pill()`/`input()` compartidos (se borró el `.admin-pill` muerto que el inline ya pisaba); `PhotosTab` se envuelve en un `card`; `EditSpotModal` se re-estila al lenguaje de modal del sitio; y `DeleteConfirmModal` se borra en favor de `<ConfirmModal confirmPhrase="CONFIRMAR">`, para lo cual `ConfirmModal` sumó ese prop opcional. Para que el admin pudiera consumirlos, `label`/`input`/`tab`/`pill` se promovieron de `dashboard/spots/[id]/styles.ts` a `lib/theme.ts`, y `.photo-grid`/`.photo-card` (duplicados entre ambas páginas) a `globals.css`.
      → `e609add` (estilos compartidos), `4795f0d` (`ConfirmModal` con frase), `d22638e` (panel admin)
- [x] **`confirm()`/`alert()` nativos en admin y dashboard** — resuelto junto con el punto anterior: los dos `confirm("¿Eliminar esta foto?")` (admin y dashboard, páginas gemelas) pasan al `ConfirmModal` compartido y el `alert("Error al subir fotos")` del admin pasa a una línea de error inline, copiando el patrón `photoError` que el `PhotosTab` del dashboard ya tenía. **Siguen pendientes** los `alert()` de `/reviews` y `ReviewsSection` (ahí correspondería el `Toast` que ya existe en `components/ui/Toast.jsx`).
      → `d22638e`
- [x] **`ReviewsSection.jsx` sigue confundiendo error de red con "no hay reviews"** — los 3 `catch {}` vacíos pasan a mostrar el error donde el usuario está mirando, uno por operación: `loadReviews` tiene ahora un estado de error propio con botón Reintentar (antes la lista quedaba vacía y la UI decía "todavía no hay reviews, sé el primero"), `loadMoreReviews` muestra el error arriba del botón, y `handleSubmit` dentro del form (lo escrito ya se conservaba, así que reintentar es apretar Publicar de nuevo). El `alert()` de `handleDelete` se reemplaza por un prop opcional `error` en `ConfirmModal`, que muestra el mensaje adentro y deja el modal abierto para reintentar — igual que `profile/DeleteAccountModal` con su `deleteError`. De paso se borró el import de `Toast`, que estaba pero no se renderizaba en ningún lado (era el único uso del componente en todo el repo: `Toast` es código muerto).
      → `12c91bd`
- [x] **Ningún modal tiene focus trap, `role="dialog"` ni cierre con Escape** — nuevo hook `lib/useModalA11y.ts` con las 5 cosas que no hacía ninguno: Escape, focus trap (Tab/Shift+Tab ciclando), foco inicial (con `initialFocusRef` para los que enfocan su input de "CONFIRMAR"), restauración del foco a quien abrió el modal, y scroll lock del body. Aplicado a los 8: `ConfirmModal`, `AuthModal`, `ShareModal`, `admin/EditSpotModal`, `profile/DeleteAccountModal`, `FilterDrawerShell`, `PhotoLightbox` e `ImageGallery`, todos con `role="dialog"`/`aria-modal`/`aria-labelledby`. Los dos lightboxes, que ya hacían Escape y scroll lock con el mismo `useEffect` duplicado, lo borraron y quedaron solo con su handler de flechas.
      → `7f011fb` (hook), `65854ef` (5 modales de diálogo), `fbe84cb` (drawer + lightboxes)
- [x] **`StarPicker` no usable solo con teclado** — los 5 SVG tenían `onClick` y nada más: sin `<input>`, sin `tabIndex`, sin `role`. Como el botón de publicar se deshabilita con `!rating`, dejar una review era directamente imposible sin mouse. Ahora son 5 `<input type="radio">` reales, ocultos con la técnica de clip (no `display:none`, que los sacaría del orden de foco), dentro de labels que envuelven cada estrella — eso da gratis el Tab, las flechas y el anuncio como grupo de radios, más anillo de foco con `:focus-visible`. `StarDisplay` suma `role="img"` + `aria-label`: la calificación existía solo como color de relleno del SVG.
      → `7d8d0f8`
- [x] **Contraste dudoso en textos secundarios + checkbox de términos no es un `<input>` nativo** — medido: `--muted` `#9a9690` daba 2.94:1 sobre blanco y 2.67:1 sobre el fondo (99 usos), `#7a7669` 4.13:1 sobre el fondo (58 usos) y `#b0aca5` 2.26:1 (6 usos), todos por debajo del 4.5:1 de WCAG AA. No alcanzaba con oscurecer `--muted`: 16 archivos usan los dos grises juntos como jerarquía de dos niveles y el valor necesario para que `--muted` pase es más oscuro que `#7a7669`, así que la jerarquía se habría invertido. Quedaron dos niveles coordinados: `--muted: #726e64` (5.08 / 4.62) y `--muted-strong: #5f5b53` (6.76 / 6.14), con el texto principal `#3d3d3a` sin tocar. Se dejan los 2 usos de `#b0ac9e` (texto de botón deshabilitado, que WCAG exime). Los dos checkboxes (AuthModal y onboarding/terms) pasan a `<input type="checkbox">` real oculto dentro del label, con el estado en CSS vía `:checked + div` / `:has(:checked)` — y sin el `onClick` del label, que con el input adentro habría hecho doble toggle.
      → `81a8654` (contraste), `8093345` (checkboxes)
- [x] **Tres mecanismos distintos de "aceptar términos" coexistiendo** — al trazarlos apareció que no era solo redundancia: **dos de los tres estaban rotos**. AuthModal funcionaba (marca `rumbo_terms_accepted`, `TermsAcceptHandler` lo persiste). AgregarLugar mostraba el mismo "al continuar aceptás nuestros términos" pero **nunca marcaba el flag**, así que quien entraba por ahí quedaba con `terms_accepted_at` en `null` para siempre — y encima el link iba a `/legal/terms`, que no existe. Y `/onboarding/terms` estaba huérfana: el redirect del middleware que la alimentaba estaba comentado. Ahora el login pasa por un único `lib/auth.ts` (`signInWithGoogle`) que concentra marcar la aceptación, el flag de tracking y el `remember_me`, así las dos pantallas no pueden volver a divergir. Antes de borrar `/onboarding/terms` se comparó su texto con `/legal`: lo único que existía solo ahí era la sección de **datos de ubicación**, que se movió al acordeón de Privacidad de `/legal` junto con el email de contacto para ejercer derechos.
      → `e932492`
- [x] **No es instalable como PWA** pese a que ya existen los íconos necesarios — según la guía de PWA de la versión local de Next (16.2.3), para ser instalable alcanza con manifest válido + HTTPS; el service worker es para offline y push. Se agregó `app/manifest.ts` (convención nativa, cero dependencias), el export `viewport` con `themeColor` en el layout y `appleWebApp` en el metadata. Verificado sirviendo el build: el manifest responde bien y el HTML trae `link rel=manifest`, `meta theme-color`, `mobile-web-app-capable` y los meta de apple. **Quedan afuera a propósito** (son ítems propios, no ajustes): *offline*, que necesita Serwist y según la misma guía "requires webpack configuration" mientras este proyecto buildea con Turbopack; y *push*, que necesita claves VAPID, tabla de suscripciones en el backend y `web-push` — eso se cruza con el ítem de retención de la sección Negocio.
      → `1b00e76`

## 05 — Negocio / producto

- [x] **Cero analytics** — Google Analytics 4 instrumentado (login, favorito, review, agregar-lugar, búsqueda)
      → `ac47866`
- [x] **SEO: cero JSON-LD + URLs numéricas en surf/kayak** — `Place`/`LocalBusiness` + `AggregateRating`, slugs amigables (`/surf/nombre-id`, sin migración de base de datos)
      → `eac584e`, `a2d24a1`
- [x] **Sin ningún camino de monetización** — cerrado por ahora: es una decisión de producto, se retoma más adelante si hace falta. El modelo de datos ya tiene los ganchos (email/whatsapp/instagram en los lugares), falta la capa de pago y destacados
- [x] **Cero retención activa** — sin email, sin notificaciones, sin newsletter
      **Resuelto así:** por ahora solo notificaciones dentro de la app. Sin email ni push: no depender de servicios con tope gratuito que después obliguen a pagar. Tabla `notifications` + `notify()` en cada evento; campanita en el Navbar con no leídas y página con la lista. Avisa al dueño/autor (spot aprobado/rechazado/despublicado con motivo, pedidos de cambio de spots y escuelas, aportes, reseñas nuevas en lo suyo, contenido que otro sumó a su lugar, reseña suya borrada por el admin) y al admin (spots nuevos o reenviados, pedidos de cambio, aportes, reportes).
      *Para más adelante (evaluado):* push de la PWA es viable sin Serwist (service worker a mano en `public/sw.js`, según la guía de Next 16.2.3; Serwist solo hace falta para offline), y no depende de un servicio pago (VAPID es estándar). Email y resumen semanal quedan descartados por ahora.
      → `8dffc23` (backend, migración 0008), `653b630` (campanita y /notificaciones)
- [x] **Contenido sin moderación real ni forma de reportar** — solo existe `is_approved` booleano, sin motivo de rechazo ni endpoint de report/flag
      **Estado al planificar:** los pedidos de cambio, aportes y cambios de escuelas ya tienen rechazo con motivo. Falta: rechazar un spot nuevo es borrarlo sin aviso; "Desaprobar" uno publicado es silencioso; el admin no puede borrar reseñas (solo su autor); no hay ninguna forma de reportar.
      **Resuelto así:**
      - *1) Rechazo de spots con motivo:* migración 0006 (motivo y fecha de rechazo en spots). "Rechazar" y "Desaprobar" piden motivo; "Eliminar" queda para spam. El dueño ve el motivo en su dashboard y en /profile, corrige y "Vuelve a enviar a revisión" (no pierde lo cargado).
      - *2) Reportes, backend:* tabla `reports` (qué, quién, motivo, comentario, estado). Se reportan spots, reseñas (spot, surf, kayak) y escuelas/kayaks. Motivos fijos + "otro" con comentario. Solo con sesión; un reporte abierto por persona y cosa; rate limit. El admin puede borrar cualquier reseña.
      - *3) Botón "Reportar"* en la página del spot, en cada reseña y en cada escuela/kayak; quien reporta solo ve "Gracias, lo vamos a revisar".
      - *4) Pestaña "Reportes" en el admin* con contador, agrupada por cosa reportada: Descartar, Despublicar el spot (con motivo), Eliminar la reseña, Eliminar la escuela. Nada se oculta solo por cantidad de reportes: siempre decide el admin.
      → `57dcc3f`, `1157c2d` (rechazo con motivo, migración 0006), `2d28775` (reportes backend, migración 0007), `6e983a4` (botón Reportar), `c8548dc` (pestaña Reportes del admin)
- [x] **Surf y Kayak rompen el patrón genérico de categoría** (estructural) — contacto y fotos duplicados en vez de reusar `SpotDB`/`SpotImage`, reviews propias en vez del sistema genérico
      **Avance:** se resolvió el problema de producto que esto causaba (la playa y sus escuelas tenían un solo dueño): las playas/lagunas son lugares públicos del admin y cada escuela o servicio tiene dueño propio, dashboard propio y la misma revisión de cambios que un spot. Sigue pendiente la parte estructural (fotos en 3 columnas de URL en vez de una tabla, reseñas propias).
      **Resuelto así:** cada escuela de surf y cada servicio de kayak es un lugar (categoría Surf / Kayak) con sus datos propios en `surf_details` / `kayak_service_details` (migración 0021, que pasó los datos, fotos, reseñas y reportes). Usan las fotos, reseñas, favoritos, panel, búsqueda y SEO de cualquier lugar; "Dónde opera" es texto libre. Las playas y lagunas quedan como lugares del admin y muestran las escuelas cercanas. Las direcciones viejas (`/surf/…`, `/kayak/…`) redirigen al lugar. La migración 0022 borra las tablas viejas.
      → `57d6e09`, `fc8e215`, `43bae43`, `082d2ba`, `60a6d53`, `2a88922`

## 06 — Pendientes fuera del código

- [x] **Google Search Console** — registrar rumboapp.uy (verificación por DNS o por archivo), mandar `https://rumboapp.uy/sitemap.xml` y revisar la cobertura de indexación. Lo hace Marcos desde su cuenta.
      → hecho: el sitemap se procesó con 81 páginas.
- [ ] **`ADMIN_SUB` en Railway** — el admin se reconoce por email y, si está esta variable, también por su `sub` de Google (`select id from users where email='<admin>'`). Sin ella, alcanza con el email.
- [ ] **Healthcheck de Railway** — poner `/health` como Healthcheck Path, para que un deploy que arranca pero no responde no reemplace al que anda.

---

# Segunda auditoría — 21/10/2026

Con todo lo de arriba resuelto. Cada hallazgo dice cómo se comprobó. Nada de
esto está implementado todavía: se decide qué se ataca y en qué orden.

## 07 — Seguridad

- [x] **[Alta, a confirmar en producción] El límite de pedidos se saltea cambiando `X-Forwarded-For`** — `limiter.get_client_ip` toma el *primer* valor del header, que lo escribe el cliente. Probado con el backend local: 25 pedidos a `/spots/check-name` (límite 20/min) desde la misma IP → 5 cortados; los mismos 25 con un `X-Forwarded-For` distinto cada uno → 0 cortados. En producción depende de si el borde de Railway borra el header que manda el cliente: en su foro hay respuestas de su equipo que se contradicen ([1](https://station.railway.com/questions/which-header-should-i-rely-on-for-real-c-d78a6f96), [2](https://station.railway.com/questions/does-the-edge-strip-client-x-forwarded-f-613e5cb6), [3](https://station.railway.com/questions/security-critical-questions-on-edge-prox-8fddd775)). Se confirma con la misma prueba contra producción (25 lecturas, nada se escribe). Si es real, todos los límites (reseñas, reportes, subidas, crear lugares) quedan sin efecto, y también se inflan las visitas de las estadísticas del dueño (`views.py` usa la misma IP). Arreglo: tomar la IP que agrega el propio proxy (el último valor, o `X-Real-IP` si Railway lo garantiza), con un test.
      **No pasa en producción.** Probado el 21/10/2026 contra Railway: 25 pedidos con un `X-Forwarded-For` inventado distinto cada uno se cortaron en el 21, igual que sin el header — el borde de Railway reemplaza el que manda el cliente. No se cambió la lógica; quedó documentado en `limiter.py` (si el backend se mueve detrás de otro proxy hay que volver a probarlo) y con `tests/test_limiter.py`.
      → `ad979ce`
- [x] **[Media] Cualquier usuario logueado puede subir archivos a Cloudinary sin que queden registrados** — `/spots/{id}/can-upload` da permiso a cualquiera en un lugar publicado con rutas o sectores (para las fotos de la comunidad), y el archivo queda público en Cloudinary apenas se sube, aunque nunca se registre con `POST /photos`. Solo lo frena el límite de 30/min por IP (que depende del punto anterior). Riesgo: gasto de la cuota gratuita y archivos ajenos servidos desde la cuenta de Rumbo. Propuesta: límite por usuario (no por IP), tamaño máximo en la firma y una limpieza periódica de archivos subidos que no quedaron registrados.
      **Resuelto así:** cada firma deja un permiso (`upload_tickets`, migración 0023, `uploads.py`): tope por usuario de 40 por hora y 150 por día (el admin sin tope), con el motivo al usuario (429); y cada 6 horas una tarea del backend borra de Cloudinary lo que se subió hace más de 24 h y no quedó registrado (ni foto de lugar, ni de ruta/sector/vía/reseña, ni en un pedido de cambio pendiente). El tamaño máximo no se puede firmar (Cloudinary no lo acepta como parámetro de subida); lo limita el plan.
      → `24c14c9`
- [x] **[Media-baja] `certifi` 2026.2.25 con una vulnerabilidad conocida** (PYSEC-2026-4320, `pip-audit`): trae una raíz de eMudhra cuyas intermedias tienen claves comprometidas. Afecta a las conexiones salientes del backend (certificados de Google, Cloudinary) si alguien está en el medio. Arreglo: `certifi>=2026.10.19`.
      → `ad979ce` (certifi 2026.10.19; `pip-audit` sin vulnerabilidades)
- [x] **[Baja] Dependencias de desarrollo con vulnerabilidades** — `npm audit`: 5 "high" en la cadena de `eslint-config-next` (`braces`/`micromatch`, denegación de servicio con patrones de archivo). Solo corre al hacer lint; producción: 0 vulnerabilidades.
      **Sin arreglo posible por ahora:** `braces` tiene la falla hasta su última versión (3.0.3) y no hay versión corregida. Solo corre al hacer lint. Se revisa cuando salga.
- [x] **[Baja, conocida] La CSP permite scripts en línea** (`'unsafe-inline'`), así que no frena un XSS, y el `id_token` de Google es legible desde el navegador (`session.id_token`, lo usa el cliente para hablarle al backend). Pasar a nonces vuelve dinámicas todas las páginas (choca con el punto E1). No se encontró ningún punto de entrada de XSS: el único `dangerouslySetInnerHTML` es el JSON-LD (escapado con `safeJson`) y los links que vienen del usuario se arman con prefijo fijo (`https://instagram.com/`, `wa.me`).
      **Se deja así a propósito:** pasar a nonces vuelve dinámicas todas las páginas. No hay ningún punto de entrada de XSS.
- [x] **[Baja] ~25 endpoints de escritura sin límite de pedidos** — todos piden ser el dueño o el admin (`/spots/{id}/trekking-detail`, `camping-amenities`, aprobar/rechazar del admin, marcar notificaciones como leídas…). Poco riesgo; se puede poner un límite general por usuario.
      60/min los del admin y 30/min el resto; `tests/test_rate_limits.py` falla si aparece un endpoint de escritura sin límite.
      → `0df94ae` (los de `routers/spots.py` entraron en `24c14c9`)
- *Revisado y bien:* los 22 endpoints de escritura que solo piden "logueado" verifican el dueño adentro (`assert_owns_spot`, `assert_owns_glamping`, `owner_remove`, borrar foto); el login valida audiencia, `email_verified` y cachea los certificados; el atajo de login del e2e (`e2e:<email>`) solo existe en `frontend/e2e/backend_e2e.py`; cabeceras de seguridad, `frame-ancestors 'none'` y `Permissions-Policy` en todas las páginas.

## 08 — Eficiencia

- [x] **[Alta] Las páginas de lugares, sectores, rutas y `/lugares` se arman de cero en cada visita** — medido en producción: la home sale de la cache de Vercel (`X-Vercel-Cache: HIT`, ~0,25 s); `/spots/…`, `/sectores/…`, `/lugares/trekking` y `/search` salen `MISS` con `Cache-Control: no-store` (~0,5–0,7 s), y cada visita le pega al backend. El build las marca `ƒ` (dinámicas). `/lugares/[slug]` declara `revalidate = 3600`, pero según la documentación de Next 16 (`generate-static-params.md`) sin `generateStaticParams` (aunque devuelva `[]`) el `revalidate` de una ruta con parámetros no tiene efecto. Propuesta: `generateStaticParams` vacío + `revalidate` en esas páginas, y revalidación a demanda (una ruta `/api/revalidate` con secreto que el backend llama al aprobar, editar o reseñar) para que los cambios se vean al instante.
      **Decidido no hacerlo por ahora** (Marcos, 21/10/2026).
- [x] **[Media] N+1 en los listados: las categorías de cada lugar se piden de a una** — contado con el backend de pruebas (5 y 20 lugares): `/spots?limit=24` pasa de 12 a 27 consultas (una `spot_categories` por lugar) y `/home` hace 24 consultas `spot_categories`. Arreglo: `selectinload(SpotDB.spot_categories)` en las consultas de listados, con un test que cuente consultas.
      `/spots` pasa de 27 a 8 consultas con 20 lugares y no crece; `tests/test_query_counts.py`.
      → `71ac7a5`
- [x] **[Baja] `/home` hace 42 consultas de base** — trae los detalles de todas las categorías (glamping, surf, kayak, motorhome…) para cards que no los muestran. La cache de 10 minutos de la home lo amortigua.
      Todas las secciones en una sola carga: 16 consultas.
      → `71ac7a5`
- [x] **[Baja] La página de un lugar hace 4–6 pedidos desde el navegador** (reseñas, resumen de reseñas, experiencias, cercanos, visita y, logueado, el estado del visitante). El resumen y los cercanos podrían venir con la página.
      Las experiencias ya venían con el lugar y se volvían a pedir: un pedido menos. El resumen de reseñas depende de quién mira (trae la reseña propia) y los cercanos están al final de la página: siguen aparte.
      → `e4edd8d`
- *Revisado y bien:* el JavaScript propio de cada página es de 53–131 KB comprimido (más el núcleo de React); lo que baja de más en páginas simples es la precarga de las páginas enlazadas, que hace Next a propósito. Leaflet y el lector de Excel se cargan solo donde se usan.

## 09 — Utilidad

- [ ] **No se puede buscar un lugar por su nombre** — el buscador filtra solo por actividad y departamento; quien busca "Arequita" no lo encuentra desde la app (sí desde Google). Es lo primero que se intenta en un buscador.
      **Pendiente de decidir cómo** (propuesta en la conversación del 21/10/2026).
- [x] **Las reseñas no tienen fotos** — la foto de alguien que fue hace poco es lo que más dice cómo está un lugar; el sistema de fotos con revisión ya existe (`item_photos`).
      **Resuelto así:** una foto por reseña, que sube solo su autor y pasa por revisión como las de la comunidad (la reseña se publica al instante; la foto, cuando la aprueba el admin, y el autor la ve "en revisión"). Borrar la reseña (autor, admin o baja de cuenta) borra la foto también de Cloudinary. `item_photos` suma el destino `review` (migración 0025).
      → `853b44a` (backend), `9ed2b97` (frontend)
- [x] **No hay forma de saber si la información está al día** — ningún lugar muestra cuándo se revisó por última vez, y "Reportar" está pensado para contenido inapropiado, no para "esto cambió" (horario, precio, acceso cerrado).
      "Última actualización: 21 de octubre de 2026" al pie de la página del lugar, al lado de Reportar. La fecha (`spots.info_updated_at`, migración 0024) se mueve sola cuando cambia la información pública o se aprueba un aporte; las reseñas, las visitas y la moderación no cuentan.
      → `66be413`

## 10 — Ideas nuevas

Pasaron a [ideas.md](ideas.md), con lo que haría falta para cada una.
→ `53ab7e9`

## 11 — Código

- [ ] **Componentes grandes, y dos que volvieron a crecer** — `admin/page.tsx` 648 líneas (había bajado a 238), `dashboard/spots/[id]/page.tsx` 654 (había bajado a 302), `AgregarLugar.tsx` 725, `agregar-lugar/submit.ts` 539, `SearchPageContent.tsx` 522, `SearchBar.jsx` 521, `ContentTab.tsx` 503, `ReviewsSection.jsx` 493, `SpotDetails.jsx` 473. En el backend, `routers/spots.py` tiene 1430 líneas y 32 endpoints (la búsqueda, `build_spots_filter_query`, sola son 234).
      **Avance:** `admin/page.tsx` 648 → 395 (`useLazyList`, `useSpotActions`, `adminNav.ts` con pruebas, `RejectModal`); `dashboard/spots/[id]/page.tsx` 654 → 448 (`useSpotForm` con pruebas, `useStagedPhotos`, `DashboardHeader`); `routers/spots.py` 1430 → 310, partido en `spot_owner.py`, `spot_admin.py`, `spot_search.py` y `spot_payloads.py`; `build_spots_filter_query` 234 → 73 más un filtro por actividad, con `tests/test_search_filters.py` (44 combinaciones, iguales antes y después); `SearchBar` 521 → 297 y `ReviewsSection` partida en tarjeta y formulario. **Quedan:** `AgregarLugar.tsx` (725), `agregar-lugar/submit.ts` (539), `SearchPageContent.tsx` (522) y `ContentTab.tsx` (503).
      → `a70bba5`, `fbca17a`, `4e53220`, `bf49ae0`, `17a218b`, `24b1aab`
- [ ] **37 archivos `.jsx` sin tipos**, entre ellos algunos de los más usados (`SearchBar`, `ReviewsSection`, `SpotDetails`, `SpotsMap`, `Navbar`, `AuthModal`), y 9 `as unknown as` para poder usarlos desde TypeScript. Pasarlos a `.tsx` de a poco, empezando por los que tocan datos del backend.
      **Avance:** pasaron a TypeScript los que se usaban con `as unknown as` y los más usados: `ReviewsSection`, `SpotDetails`, `SpotImages`, `SearchBar`, `SpotCard`, `ImageGallery`, `ShareModal`, `LocationPicker`, `TrekkingRouteTraits`, `TrekkingAmenitiesCard` y el store de favoritos. Ya no queda ningún `as unknown as` (eran 8). **Quedan 26 `.jsx`** (unas 3400 líneas: `SpotsMap`, `NavBarContent`, `SpotSection`, `Footer`, `AuthModal`…).
      → `17a218b`, `c00f1c4`, `24b1aab`, `88f66c7`
- [x] **10 avisos de dependencias de `useEffect`** (`react-hooks/exhaustive-deps`): `ContentTab.tsx:90`, `dashboard/spots/[id]/page.tsx:131`, `AgregarLugar.tsx:179`, `LocationPickerMap.jsx:26`, `SpotPickerMap.jsx:25`, `Providers.jsx:76`, `ReviewsSection.jsx:111`, `SpotsMap.jsx:149` y `:164`, `Toast.jsx:12`. Cada uno puede ser un dato viejo en pantalla; revisarlos uno por uno.
      Uno era un bug: las reseñas se cargaban sin sesión y no se volvían a pedir al llegar, así que no se sabía cuál era la tuya y ofrecía escribir otra (que el backend rechaza). Los otros eran a propósito: quedan explicados en el código.
      → `732ff76`
- [x] **Código muerto** — `components/ui/Toast.jsx` sigue en el repo sin ningún uso (ya señalado en `12c91bd`), y 7 variables sin usar (`StepResumen.tsx`, `StepExperiencias.tsx`, `SpotDetails.jsx`, `linkControl.ts`…).
      Sin `Toast.jsx` ni variables sin usar. **Encontrado en el camino:** la prueba de hover del Navbar pasaba siempre (buscaba el texto literal `${sel}` y comparaba `undefined` con `undefined`). Lint: de 42 a 23 avisos, todos `<img>` a propósito.
      → `68ac4a6`
- *Bien:* 712 tests en el frontend y 359 en el backend, e2e de 103 pasos; 0 errores de lint; sin `console.log` olvidados.
