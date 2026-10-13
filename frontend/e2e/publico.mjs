// Lo público, en PC y en celular: la barra (que no salte entre páginas), el
// menú, la 404, legal, el footer y que no haya errores de JavaScript.
import { FRONT, apiGet, shot } from "./lib.mjs"

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
  for (const [label, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport })
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

    const res = await page.goto(`${FRONT}/esto-no-existe`, { waitUntil: "networkidle" })
    r.ok(`[${label}] 404 propia`, res.status() === 404 && (await page.getByRole("heading", { name: "No encontramos esta página" }).count()) === 1)

    await page.goto(`${FRONT}/legal#privacidad`, { waitUntil: "networkidle" })
    const top = await page.evaluate(() => document.getElementById("privacidad").getBoundingClientRect().top)
    r.ok(`[${label}] /legal#privacidad abre en su sección`, top >= 0 && top < 200, `a ${Math.round(top)}px`)

    const footer = await page.locator("footer").evaluate(el => el.textContent)
    r.ok(`[${label}] footer con Explorar y sin "Código abierto"`, footer.includes("Explorar") && !footer.includes("Código abierto"))

    r.ok(`[${label}] sin errores de JavaScript`, errors.length === 0, errors.slice(0, 2).join(" | "))
    await ctx.close()
  }
}
