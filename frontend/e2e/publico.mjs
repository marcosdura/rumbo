// Lo público, en PC y en celular: la barra (que no salte entre páginas), el
// menú, la 404, legal, el footer y que no haya errores de JavaScript.
import { FRONT, apiGet, shot, offlineMaps, a11yProblems, fakeCloudinary, cspViolations, hoverChanges } from "./lib.mjs"

const VIEWPORTS = [["pc", { width: 1280, height: 800 }], ["celular", { width: 390, height: 844 }]]

// La barra visible: en la home es la del hero (el Navbar fijo arranca oculto).
const barBoxes = page => page.evaluate(() => {
  const bar = [...document.querySelectorAll(".nav-bar")].find(b => {
    const nav = b.closest(".navbar-home-fixed")
    return !nav || nav.classList.contains("navbar-visible")
  })
  const box = el => { const x = el.getBoundingClientRect(); return [Math.round(x.top), Math.round(x.left), Math.round(x.height)].join(",") }
  return { bar: box(bar), logo: box(bar.querySelector(".navbar-logo")), menu: box(bar.querySelector('button[aria-label="Menú"]')) }
})

export async function run(browser, r) {
  const [{ slug }] = await apiGet("/spots/ids")

  // SEO: lo que recibe Google en el HTML (sin navegador).
  const html = async path => (await fetch(`${FRONT}${path}`)).text()
  const spotHtml = await html(`/spots/${slug}`)
  r.ok("SEO — un lugar tiene canónica", spotHtml.includes(`<link rel="canonical" href="https://rumboapp.uy/spots/${slug}"`))
  r.ok("SEO — og:image con la dirección completa", /<meta property="og:image" content="https:\/\//.test(spotHtml))
  r.ok("SEO — /favorites fuera de Google", /<meta name="robots" content="noindex, nofollow"/.test(await html("/favorites")))
  const sitemapXml = await html("/sitemap.xml")
  r.ok("SEO — el sitemap incluye rutas y sectores", sitemapXml.includes("/rutas/") && sitemapXml.includes("/sectores/"))
  // Las direcciones viejas de escuelas y kayaks llevan al lugar (permanente).
  const old = await fetch(`${FRONT}/surf/escuela-vieja-7`, { redirect: "manual" })
  r.ok("SEO — la dirección vieja de una escuela lleva a su lugar", old.status === 308 && (old.headers.get("location") ?? "").endsWith("/spots/escuela-de-prueba"),
    `${old.status} ${old.headers.get("location")}`)
  r.ok("SEO — un kayak viejo que no existe da 404", (await fetch(`${FRONT}/kayak/nada-999`, { redirect: "manual" })).status === 404)
  // Las páginas por actividad y departamento llegan a Google con los lugares.
  const surfRocha = await html("/lugares/surf/rocha")
  r.ok("SEO — /lugares/surf/rocha trae su título y los lugares en el HTML",
    surfRocha.includes("<title>Surf en Rocha | Rumbo</title>") && surfRocha.includes('href="/spots/escuela-de-prueba"') && surfRocha.includes('href="/spots/playa-de-prueba"'))
  r.ok("SEO — una combinación sin lugares da 404", (await fetch(`${FRONT}/lugares/surf/artigas`)).status === 404)
  r.ok("SEO — el sitemap incluye las páginas /lugares y no la búsqueda",
    sitemapXml.includes("/lugares/surf/rocha</loc>") && sitemapXml.includes("/lugares/trekking</loc>") && !sitemapXml.includes("/search</loc>"))
  const searchHtml = await html("/search?activity=Surf")
  r.ok("SEO — la búsqueda queda fuera de Google, con título según el filtro",
    /<meta name="robots" content="noindex, follow"/.test(searchHtml) && searchHtml.includes("<title>Buscar: Surf en Uruguay | Rumbo</title>"))
  // Rendimiento: la búsqueda llega con los lugares (antes los pedía el
  // navegador), el CSS de la card va una vez y hay conexión anticipada.
  r.ok("Rendimiento — la búsqueda llega con los lugares en el HTML", searchHtml.includes("Playa de Prueba") && searchHtml.includes("Escuela de Prueba"))
  r.ok("Rendimiento — el CSS de la card no se repite por card", !surfRocha.includes(".spot-card {"))
  // Las fotos de las primeras cards se piden de entrada (antes, en /lugares,
  // todas con "lazy": la foto más grande se pedía a los ~3,7 s).
  const playaImg = surfRocha.match(/<img[^>]*alt="Playa de Prueba"[^>]*>/)?.[0] ?? ""
  r.ok("Rendimiento — /lugares precarga la foto de las primeras cards",
    /<link rel="preload" as="image"[^>]*rumbo\/spots\/e2e\/playa/.test(surfRocha) && playaImg !== "" && !playaImg.includes('loading="lazy"'), playaImg.slice(0, 120))
  r.ok("Rendimiento — conexión anticipada a Cloudinary", surfRocha.includes('rel="preconnect" href="https://res.cloudinary.com"'))
  // Seguridad: las cabeceras están en las páginas y no se anuncia Next.js.
  const home = await fetch(`${FRONT}/`)
  r.ok("Seguridad — cabeceras (CSP, sin iframes ajenos, nosniff) y sin X-Powered-By",
    /frame-ancestors 'none'/.test(home.headers.get("content-security-policy") ?? "") && home.headers.get("x-frame-options") === "DENY"
    && home.headers.get("x-content-type-options") === "nosniff" && !home.headers.has("x-powered-by"))
  const og = await fetch(`${FRONT}/opengraph-image`)
  r.ok("SEO — la imagen por defecto para compartir se genera", og.ok && og.headers.get("content-type") === "image/png")
  for (const [label, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport })
    await offlineMaps(ctx)
    await fakeCloudinary(ctx)
    const csp = cspViolations(ctx)
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", e => errors.push(e.message))

    await page.goto(`${FRONT}/spots/${slug}`, { waitUntil: "networkidle" })
    const lupa = await page.locator('.navbar-root button[aria-label="Buscar"]').isVisible()
    r.ok(`[${label}] lupa del buscador ${label === "pc" ? "oculta" : "visible"}`, lupa === (label === "celular"))
    const detail = await barBoxes(page)
    await shot(page, `${label}-detalle`)
    // Al scrollear, el mapa pasa por debajo del navbar fijo (antes las capas de
    // Leaflet quedaban encima y el mapa "seguía" la pantalla).
    const underNavbar = await page.evaluate(async () => {
      // El control de zoom (+/−) es lo que Leaflet pone más arriba (z-index
      // 1000): se lo lleva debajo del navbar y se mira qué queda encima.
      const zoom = document.querySelector(".mapcard-map-wrap .leaflet-control-zoom")
      const nav = document.querySelector(".navbar-root")
      if (!zoom || !nav) return "sin mapa o navbar"
      const bar = nav.getBoundingClientRect()
      window.scrollTo(0, zoom.getBoundingClientRect().top + window.scrollY - bar.height / 2)
      await new Promise(r => setTimeout(r, 300))
      const z = zoom.getBoundingClientRect()
      const hit = document.elementFromPoint(z.left + z.width / 2, z.top + z.height / 2)
      return hit?.closest(".navbar-root") ? "navbar" : hit?.className?.toString() ?? "nada"
    })
    r.ok(`[${label}] el mapa pasa por debajo del navbar al scrollear`, underNavbar === "navbar", underNavbar)
    await page.goto(`${FRONT}/`, { waitUntil: "networkidle" })
    const home = await barBoxes(page)
    // La navbar fija arranca oculta en la home: una sola barra a la vista.
    const visibleBars = await page.evaluate(() => [...document.querySelectorAll(".nav-bar")]
      .filter(b => { const nav = b.closest("nav"); return !nav || getComputedStyle(nav).opacity !== "0" }).length)
    r.ok(`[${label}] la home abre con una sola barra`, visibleBars === 1, `${visibleBars} visibles`)
    await shot(page, `${label}-home`)
    r.ok(`[${label}] la barra no salta entre un detalle y la home`, JSON.stringify(detail) === JSON.stringify(home),
      `detalle ${JSON.stringify(detail)} / home ${JSON.stringify(home)}`)

    const menu = page.locator('#hero-section button[aria-label="Menú"]')
    await menu.click()
    const opened = await menu.getAttribute("aria-expanded")
    await page.keyboard.press("Escape")
    r.ok(`[${label}] el menú abre y Escape lo cierra`, opened === "true" && (await menu.getAttribute("aria-expanded")) === "false")

    // La lista del buscador del hero queda por encima de "¿Conocés un lugar
    // que no está?" (antes el texto se veía encima de las opciones).
    await page.locator("#hero-section").getByPlaceholder("¿Qué querés hacer?").click()
    await page.waitForTimeout(500)
    const invite = await page.evaluate(() => {
      const list = document.querySelector("#hero-section .search-dropdown").getBoundingClientRect()
      const overlaps = [...document.querySelectorAll(".hero-invite > *")].map(el => el.getBoundingClientRect())
        .filter(b => b.left < list.right && b.right > list.left && b.top < list.bottom && b.bottom > list.top)
      const covered = overlaps.filter(b => !document.elementFromPoint(Math.max(b.left, list.left) + 4, Math.max(b.top, list.top) + 4)?.closest(".search-dropdown"))
      return { overlaps: overlaps.length, covered: covered.length }
    })
    // La lista, del ancho de la pill de su campo.
    const widths = await page.evaluate(() => ["#hero-section .search-dropdown", "#hero-section .search-field.is-open"]
      .map(sel => Math.round(document.querySelector(sel).getBoundingClientRect().width)))
    await page.keyboard.press("Escape")
    r.ok(`[${label}] la lista del buscador tiene el ancho de su campo`, Math.abs(widths[0] - widths[1]) <= 1, `lista ${widths[0]}px, campo ${widths[1]}px`)
    r.ok(`[${label}] la lista del buscador del hero tapa la invitación de abajo`, invite.covered === 0 && (label !== "pc" || invite.overlaps > 0), JSON.stringify(invite))

    // Ordenar, en la búsqueda: la lista queda por encima de los resultados y
    // la flecha es la › de las vías (antes ▼).
    await page.goto(`${FRONT}/search`, { waitUntil: "networkidle" })
    const sortBtn = page.getByRole("combobox", { name: "Ordenar" })
    const chevron = await sortBtn.locator(".sort-menu-chevron").textContent()
    await sortBtn.click()
    await page.waitForTimeout(400)
    const sortOnTop = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".sort-menu-list [role=option]")]
      return items.length > 0 && items.every(li => { const b = li.getBoundingClientRect(); return !!document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)?.closest(".sort-menu-list") })
    })
    await page.keyboard.press("Escape")
    r.ok(`[${label}] Ordenar: la lista se ve entera, por encima de los resultados`, sortOnTop && chevron === "›", `encima ${sortOnTop}, flecha «${chevron}»`)

    // "Dónde": sugiere lugares por su nombre y lleva directo a su página;
    // un texto que no es departamento busca por nombre (q).
    await page.goto(`${FRONT}/`, { waitUntil: "networkidle" })
    const where = page.locator("#hero-section").getByPlaceholder("Departamento o lugar")
    await where.click()
    await where.fill("roca")
    const suggestion = page.locator("#hero-section .search-dropdown-item", { hasText: "Roca de Prueba" })
    await suggestion.waitFor({ timeout: 5000 }).catch(() => {})
    const suggested = await suggestion.count()
    if (suggested) await suggestion.dispatchEvent("mousedown")
    await page.waitForURL("**/spots/roca-de-prueba", { timeout: 10000 }).catch(() => {})
    r.ok(`[${label}] Dónde: sugiere un lugar por su nombre y lleva a su página`, suggested === 1 && page.url().endsWith("/spots/roca-de-prueba"), page.url())
    await page.goto(`${FRONT}/`, { waitUntil: "networkidle" })
    await where.click()
    await where.fill("cascada")
    // La lista abierta tapa "Buscar" en el celular: se elige la opción de texto.
    await page.locator("#hero-section .search-dropdown-item", { hasText: "Buscar «cascada»" }).dispatchEvent("mousedown")
    await page.locator("#hero-section").getByRole("button", { name: "Buscar", exact: true }).click()
    await page.waitForURL("**/search?**", { timeout: 10000 }).catch(() => {})
    r.ok(`[${label}] Dónde: un texto busca por nombre`, new URL(page.url()).searchParams.get("q") === "cascada", page.url())

    if (label === "pc") {
      // El hover común en los botones que no tenían (globals.css .btn-hover).
      await page.goto(`${FRONT}/spots/cerro-de-prueba/rutas/sendero-uno`, { waitUntil: "networkidle" })
      const noHover = []
      for (const name of ["🔗 Compartir", "＋ Subir fotos", "＋ Subir el recorrido (GPX)"]) {
        if (!(await hoverChanges(page, page.getByRole("button", { name, exact: true })))) noHover.push(name)
      }
      // Los datos de la ruta son la Pill de la app: hover y sin cursor de texto.
      const statPill = page.locator(".trail-stats-compact .pill-hover").first()
      const hasStatPill = (await statPill.count()) > 0
      if (!hasStatPill || !(await hoverChanges(page, statPill))) noHover.push("pill de datos")
      const pillCursor = hasStatPill ? await statPill.evaluate(el => [getComputedStyle(el).userSelect, getComputedStyle(el).cursor].join(",")) : "no es una Pill"
      r.ok("Ruta — las pills de datos no se seleccionan como texto", !pillCursor.startsWith("text") && pillCursor.startsWith("none"), pillCursor)
      await page.goto(`${FRONT}/spots/roca-de-prueba/sectores/sector-norte`, { waitUntil: "networkidle" })
      if (!(await hoverChanges(page, page.getByRole("link", { name: "＋ Sugerir una vía" })))) noHover.push("Sugerir una vía")
      await page.goto(`${FRONT}/`, { waitUntil: "networkidle" })
      if (!(await hoverChanges(page, page.locator("main").getByRole("link", { name: "＋ Agregar lugar" })))) noHover.push("Agregar lugar (entre las colecciones)")
      await page.goto(`${FRONT}/esto-no-existe`, { waitUntil: "networkidle" })
      for (const name of ["Ir al inicio", "Ver todos los lugares"]) {
        if (!(await hoverChanges(page, page.getByRole("link", { name, exact: true })))) noHover.push(`404: ${name}`)
      }
      await page.goto(`${FRONT}/spots/cerro-de-prueba`, { waitUntil: "networkidle" })
      for (const name of ["⚑ Reportar este lugar", "¡Sé el primero en reseñar!"]) {
        if (!(await hoverChanges(page, page.getByRole("button", { name, exact: true })))) noHover.push(name)
      }
      await page.goto(`${FRONT}/lugares/surf`, { waitUntil: "networkidle" })
      if (!(await hoverChanges(page, page.locator(".places-search").last()))) noHover.push("Filtrar y ver en el mapa")
      r.ok("Botones sueltos con hover (Compartir, Subir fotos, Reportar...)", noHover.length === 0, noHover.join(", "))
    }

    // El título de la búsqueda no queda debajo del contador ni de los botones
    // (en el celular se leía "Campg 8").
    await page.goto(`${FRONT}/search?activity=Motorhome`, { waitUntil: "networkidle" })
    const covered = await page.evaluate(() => {
      const h = document.querySelector("h1.search-title")
      const range = document.createRange()
      range.selectNodeContents(h)
      const t = range.getBoundingClientRect()
      return [...h.parentElement.querySelectorAll("button, span")].filter(e => !h.contains(e))
        .map(e => e.getBoundingClientRect())
        .filter(o => o.width && o.left < t.right && o.right > t.left && o.top < t.bottom && o.bottom > t.top).length
    })
    r.ok(`[${label}] el título de la búsqueda no queda tapado`, covered === 0, `${covered} encima`)

    // El pronóstico: 5 días y, en una playa de surf, las olas (el backend del
    // e2e lo simula). En el celular se desliza sin correr la página.
    await page.goto(`${FRONT}/spots/playa-de-prueba`, { waitUntil: "networkidle" })
    await page.locator(".forecast-day").first().waitFor({ timeout: 10000 }).catch(() => {})
    const forecastDays = await page.locator(".forecast-day").allInnerTexts()
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    await page.locator(".forecast-days").scrollIntoViewIfNeeded().catch(() => {})
    await shot(page, `${label}-pronostico`)
    r.ok(`[${label}] el pronóstico del lugar, con olas en surf`,
      forecastDays.length === 5 && forecastDays.every(t => t.includes("🌊")) && pageOverflow === 0,
      `${forecastDays.length} días, ${pageOverflow}px de más`)

    if (label === "pc") {
      // Los pins del mapa dicen el nombre del lugar (antes todos "Surf"). Por
      // nombre, para que quede un solo pin (en el e2e están todos en el mismo punto).
      await page.goto(`${FRONT}/search?activity=Surf&q=playa`, { waitUntil: "networkidle" })
      await page.locator(".spot-pin").first().waitFor({ timeout: 10000 }).catch(() => {})
      const pins = await page.locator(".spot-pin").allInnerTexts()
      r.ok("[pc] los pins del mapa dicen el nombre del lugar", pins.some(t => t.includes("Playa de Prueba")), pins.join(" | ").slice(0, 120))
    }

    if (label === "celular") {
      // Un email largo corta después de la @, no en cualquier letra.
      await page.goto(`${FRONT}/spots/laguna-de-prueba`, { waitUntil: "networkidle" })
      const lines = await page.locator('a[href^="mailto:"]').first().evaluate(a => [...a.childNodes].filter(n => n.nodeType === 3).map(n => {
        const range = document.createRange()
        range.selectNodeContents(n)
        return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size
      }))
      r.ok("[celular] un email largo corta después de la @", lines.length === 2 && lines.every(n => n === 1), JSON.stringify(lines))
    }

    await page.goto(`${FRONT}/lugares/surf`, { waitUntil: "networkidle" })
    const cards =await page.locator(".places-grid .spot-card").count()
    await page.getByRole("link", { name: /^Rocha/ }).click()
    await page.waitForURL("**/lugares/surf/rocha")
    r.ok(`[${label}] /lugares/surf muestra los lugares y lleva a Surf en Rocha`, cards === 2 && (await page.locator("h1").textContent()).includes("Surf en Rocha"), `${cards} cards`)
    await shot(page, `${label}-lugares`)

    const res = await page.goto(`${FRONT}/esto-no-existe`, { waitUntil: "networkidle" })
    r.ok(`[${label}] 404 propia`, res.status() === 404 && (await page.getByRole("heading", { name: "No encontramos esta página" }).count()) === 1)

    await page.goto(`${FRONT}/legal#privacidad`, { waitUntil: "networkidle" })
    const top = await page.evaluate(() => document.getElementById("privacidad").getBoundingClientRect().top)
    r.ok(`[${label}] /legal#privacidad abre en su sección`, top >= 0 && top < 200, `a ${Math.round(top)}px`)

    const footer = await page.locator("footer").evaluate(el => el.textContent)
    r.ok(`[${label}] footer con Explorar y sin "Código abierto"`, footer.includes("Explorar") && !footer.includes("Código abierto"))

    // Accesibilidad: lo grave, el contenido principal y el título, en cada tipo de página.
    for (const path of ["/", "/search?activity=Surf", "/lugares/surf/rocha", "/spots/cerro-de-prueba", "/spots/cerro-de-prueba/rutas/sendero-uno", "/legal"]) {
      await page.goto(`${FRONT}${path}`, { waitUntil: "networkidle" })
      const problems = await a11yProblems(page)
      r.ok(`[${label}] accesibilidad de ${path}`, problems.length === 0, problems.slice(0, 3).join(" | "))
    }
    if (label === "pc") {
      // Con el teclado, lo primero es "Saltar al contenido", y lleva a lo principal.
      await page.goto(`${FRONT}/spots/cerro-de-prueba`, { waitUntil: "networkidle" })
      await page.keyboard.press("Tab")
      const first = await page.evaluate(() => document.activeElement?.textContent)
      await page.keyboard.press("Enter")
      r.ok("[pc] Tab: primero «Saltar al contenido», que lleva al contenido", first === "Saltar al contenido" && page.url().endsWith("#contenido"), first ?? "")
      // En la home, la barra fija (oculta sobre el hero) no recibe el foco.
      await page.goto(`${FRONT}/`, { waitUntil: "networkidle" })
      let inHidden = false
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab")
        inHidden ||= await page.evaluate(() => !!document.activeElement?.closest(".navbar-home-fixed:not(.navbar-visible)"))
      }
      r.ok("[pc] en la home el teclado no entra en la barra oculta", !inHidden)
      // La galería del celular está oculta en la compu, pero su principal
      // lleva priority y se baja igual: antes a 1920px, ahora la más chica.
      // Con dos fotos la grilla de la compu las pide a 640px, así que algo
      // más grande solo puede venir de la galería oculta.
      const widths = []
      const onRequest = req => {
        const url = decodeURIComponent(req.url())
        if (url.includes("e2e/playa") && !url.includes("e_blur")) widths.push(Number(url.match(/w_(\d+)/)?.[1] ?? 0))
      }
      page.on("request", onRequest)
      await page.goto(`${FRONT}/spots/playa-de-prueba`, { waitUntil: "networkidle" })
      page.off("request", onRequest)
      r.ok("[pc] la galería oculta del celular no baja la foto grande", widths.length > 0 && Math.max(...widths) <= 640, widths.join(", "))
    }

    r.ok(`[${label}] sin errores de JavaScript`, errors.length === 0, errors.slice(0, 2).join(" | "))
    r.ok(`[${label}] la política de seguridad (CSP) no bloquea nada del sitio`, csp.length === 0, csp.slice(0, 2).join(" | "))
    await ctx.close()
  }
}
