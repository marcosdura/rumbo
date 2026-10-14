// Lo público, en PC y en celular: la barra (que no salte entre páginas), el
// menú, la 404, legal, el footer y que no haya errores de JavaScript.
import { FRONT, apiGet, shot, offlineMaps, a11yProblems, fakeCloudinary } from "./lib.mjs"

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
  const og = await fetch(`${FRONT}/opengraph-image`)
  r.ok("SEO — la imagen por defecto para compartir se genera", og.ok && og.headers.get("content-type") === "image/png")
  for (const [label, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport })
    await offlineMaps(ctx)
    await fakeCloudinary(ctx)
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", e => errors.push(e.message))

    await page.goto(`${FRONT}/spots/${slug}`, { waitUntil: "networkidle" })
    const lupa = await page.locator('.navbar-root button[aria-label="Buscar"]').isVisible()
    r.ok(`[${label}] lupa del buscador ${label === "pc" ? "oculta" : "visible"}`, lupa === (label === "celular"))
    const detail = await barBoxes(page)
    await shot(page, `${label}-detalle`)
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

    await page.goto(`${FRONT}/lugares/surf`, { waitUntil: "networkidle" })
    const cards = await page.locator(".places-grid .spot-card").count()
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
    }

    r.ok(`[${label}] sin errores de JavaScript`, errors.length === 0, errors.slice(0, 2).join(" | "))
    await ctx.close()
  }
}
