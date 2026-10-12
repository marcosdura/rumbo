// Con sesión iniciada: el formulario de agregar lugar entero (cada flujo, de
// punta a punta) y después el perfil, que tiene que mostrar lo cargado.
// Verifica en el backend que cada envío haya quedado guardado.
import { ADMIN, FRONT, PHOTO, USER, apiGet, apiPost, fakeCloudinary, loggedIn, shot } from "./lib.mjs"

// Sufijo por corrida: los nombres no se repiten si la base ya tiene datos.
const RUN = Date.now().toString(36).slice(-4)
const named = base => `${base} ${RUN}`

// Un campo de agregar-lugar por el texto de su etiqueta (ui/Field.tsx).
const field = (page, label) =>
  page.locator(`xpath=//div[starts-with(normalize-space(.), "${label}")]/following-sibling::*[self::input or self::textarea or self::select][1]`).first()

const heading = page => page.locator("h2").first().textContent()

// Siguiente: tiene que cambiar de paso; si no, el error que muestra el form.
async function next(page) {
  const before = await heading(page)
  await page.getByRole("button", { name: "Siguiente", exact: true }).click()
  try {
    await page.waitForFunction(b => document.querySelector("h2")?.textContent !== b, before, { timeout: 5000 })
  } catch {
    const errors = await page.locator("p").filter({ hasText: /obligatori|Completá|Seleccioná|Agregá|Elegí|nombre/i }).allTextContents()
    throw new Error(`no avanzó de «${before}»: ${errors.slice(0, 3).join(" / ") || "sin mensaje"}`)
  }
}

const click = (page, name) => page.getByRole("button", { name, exact: false }).first().click()

// Datos básicos de un lugar nuevo (StepInfoBasica).
async function basicInfo(page, name, { department = "Rocha", responsible = true } = {}) {
  if (await page.getByRole("button", { name: /Sí, soy el responsable/ }).count()) {
    await click(page, responsible ? /Sí, soy el responsable/ : /No, lo conozco/)
  }
  await field(page, "Nombre del lugar").fill(name)
  await field(page, "Descripción").fill(`${name}: un lugar de prueba para el recorrido e2e.`)
  await field(page, "Departamento").selectOption(department)
  await field(page, "Precio").fill("0")
  await field(page, "Email del lugar").fill("contacto@e2e.test")
  await click(page, /Público/)
  await page.getByPlaceholder("Pegar link de Google Maps...").fill("https://www.google.com/maps/@-34.65,-54.17,15z")
  // El chequeo de nombre repetido es con un retraso de medio segundo.
  await page.waitForTimeout(800)
}

// Comodidades: pide al menos 3 (cada categoría tiene las suyas: las primeras).
async function amenities(page) {
  const chips = page.locator('xpath=//*[starts-with(normalize-space(.), "Seleccioná al menos 3")]/following::button')
  for (let i = 0; i < 3; i++) await chips.nth(i).click()
}

async function submit(page) {
  await page.getByRole("button", { name: "Confirmar y enviar" }).click()
  const done = page.getByText(/^¡(Gracias|Listo)/).first()
  try {
    await done.waitFor({ timeout: 20000 })
  } catch {
    // El error que muestra el resumen (o el aviso de lo que no se guardó).
    const error = await page.locator("p").filter({ hasText: /error|No se pudo|falló|intentá/i }).allTextContents()
    throw new Error(`el envío no terminó: ${error.slice(-2).join(" / ") || "sin mensaje"}`)
  }
  return done.textContent()
}

async function startFlow(page, category) {
  await page.goto(`${FRONT}/agregar-lugar`, { waitUntil: "networkidle" })
  // Un borrador de un flujo anterior: empezar de cero.
  const discard = page.getByText("Empezar de cero")
  if (await discard.count()) await discard.first().click()
  await click(page, new RegExp(`^\\S*\\s*${category}$`))
}

// Un lugar existente, en el buscador de lugares (forms/SpotPicker.tsx).
async function pickSpot(page, name) {
  await page.getByRole("combobox").fill(name)
  await page.getByRole("option", { name: new RegExp(name) }).first().dispatchEvent("mousedown")
}

// La primera opción real de un <select>.
async function selectFirst(locator) {
  const value = await locator.evaluate(el => [...el.options].find(o => o.value && !o.disabled)?.value)
  await locator.selectOption(value)
}

// Una foto en el primer selector de fotos visible del paso.
const addPhoto = page => page.locator('input[type="file"]').first().setInputFiles(PHOTO)

// Cada flujo: qué carga y qué tiene que quedar en el backend (un lugar
// nuevo en revisión, o un aporte en revisión con ese nombre).
const FLOWS = [
  {
    name: "Camping: lugar nuevo",
    async fill(page) {
      await startFlow(page, "Camping")
      await basicInfo(page, named("Camping E2E"))
      await next(page) // → comodidades
      await amenities(page)
      await next(page) // → experiencias
      await next(page) // → imágenes
      await addPhoto(page)
      await next(page) // → categorías adicionales
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias!", spot: named("Camping E2E") },
  },
  {
    name: "Glamping: lugar nuevo con un alojamiento",
    async fill(page) {
      await startFlow(page, "Glamping")
      await basicInfo(page, named("Glamping E2E"))
      await next(page) // → alojamientos
      await selectFirst(field(page, "Tipo de alojamiento"))
      await field(page, "Capacidad (personas)").fill("4")
      await field(page, "Precio por noche").fill("3000")
      await field(page, "Mínimo de noches").fill("0")
      await next(page) // → comodidades
      await amenities(page)
      await next(page) // → experiencias
      await next(page) // → imágenes
      await addPhoto(page)
      await next(page) // → categorías adicionales
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias!", spot: named("Glamping E2E") },
  },
  {
    name: "Motorhome: lugar nuevo",
    async fill(page) {
      await startFlow(page, "Motorhome")
      await basicInfo(page, named("Motorhome E2E"))
      await next(page) // → detalle de motorhome
      await field(page, "Capacidad (cantidad de motorhomes)").fill("5")
      await selectFirst(field(page, "Tipo de superficie"))
      // ¿Tiene agua / electricidad / dump station?
      for (const yes of await page.getByRole("button", { name: "Sí", exact: true }).all()) await yes.click()
      await next(page) // → experiencias
      await next(page) // → imágenes
      await addPhoto(page)
      await next(page) // → categorías adicionales
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias!", spot: named("Motorhome E2E") },
  },
  {
    name: "Trekking: lugar nuevo con una ruta",
    async fill(page) {
      await startFlow(page, "Trekking")
      await click(page, /Nuevo lugar de trekking/)
      await basicInfo(page, named("Trekking E2E"), { department: "Lavalleja" })
      await next(page) // → características
      // Las obligatorias no aceptan "No sé": se responde Sí a todas.
      for (const yes of await page.getByRole("button", { name: "Sí", exact: true }).all()) await yes.click()
      await next(page) // → rutas
      await field(page, "Nombre").fill(named("Ruta E2E"))
      await next(page) // → imágenes
      await addPhoto(page)
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias!", spot: named("Trekking E2E") },
  },
  {
    name: "Trekking: ruta nueva en un lugar propio",
    async fill(page) {
      await startFlow(page, "Trekking")
      await click(page, /Nueva ruta/)
      await page.locator("select").first().selectOption({ label: named("Trekking E2E") })
      await next(page) // → rutas
      await field(page, "Nombre").fill(named("Ruta Dos E2E"))
      await next(page) // → resumen
      return submit(page)
    },
    // El lugar es propio y todavía no está aprobado: se suma directo.
    expect: { title: "¡Listo!" },
  },
  {
    name: "Escalada: lugar nuevo con un sector",
    async fill(page) {
      await startFlow(page, "Escalada")
      await click(page, /Nuevo lugar de escalada/)
      await basicInfo(page, named("Escalada E2E"), { department: "Lavalleja" })
      await next(page) // → sectores
      await field(page, "Nombre").fill(named("Sector E2E"))
      await next(page) // → vías (opcional)
      await next(page) // → imágenes
      await addPhoto(page)
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias!", spot: named("Escalada E2E") },
  },
  {
    name: "Escalada: sector nuevo en un lugar de otro",
    async fill(page) {
      await startFlow(page, "Escalada")
      await click(page, /Nuevo sector/)
      await pickSpot(page, "Roca de Prueba")
      await next(page) // → datos del sector
      await field(page, "Nombre").fill(named("Sector Sur E2E"))
      await next(page) // → vías (opcional)
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias por tu aporte!", contribution: named("Sector Sur E2E") },
  },
  {
    name: "Escalada: vías nuevas en un sector existente",
    async fill(page) {
      await startFlow(page, "Escalada")
      await click(page, /Nuevas vías/)
      await pickSpot(page, "Roca de Prueba")
      await next(page) // → sector
      await page.locator("select").first().selectOption({ label: "Sector Norte" })
      await next(page) // → vías
      await field(page, "Nombre").fill(named("Via E2E"))
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias por tu aporte!", contribution: named("Via E2E") },
  },
  {
    name: "Surf: escuela en una playa existente",
    async fill(page) {
      await startFlow(page, "Surf")
      await pickSpot(page, "Playa de Prueba")
      await next(page) // → datos de la escuela
      await field(page, "Nombre de la escuela").fill(named("Escuela E2E"))
      await addPhoto(page)
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias por tu aporte!", contribution: named("Escuela E2E") },
  },
  {
    name: "Surf: playa nueva con su escuela",
    async fill(page) {
      await startFlow(page, "Surf")
      await click(page, /Mi playa no está en la lista/)
      await basicInfo(page, named("Playa E2E"))
      await next(page) // → imágenes
      await addPhoto(page)
      await next(page) // → escuela
      await field(page, "Nombre de la escuela").fill(named("Escuela Playa E2E"))
      await addPhoto(page)
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias!", spot: named("Playa E2E") },
  },
  {
    name: "Kayak: servicio en una laguna existente",
    async fill(page) {
      await startFlow(page, "Kayak")
      await pickSpot(page, "Laguna de Prueba")
      await next(page) // → datos del servicio
      await field(page, "Nombre").fill(named("Kayak E2E"))
      await addPhoto(page)
      await next(page) // → resumen
      return submit(page)
    },
    expect: { title: "¡Gracias por tu aporte!", contribution: named("Kayak E2E") },
  },
]

// Lo que tiene que haber quedado en el backend después de cada flujo.
async function saved(flow) {
  if (flow.expect.spot) {
    const spot = (await apiGet("/admin/spots", ADMIN)).find(s => s.name === flow.expect.spot)
    if (!spot) return [false, "pero el lugar no está en el backend"]
    if (spot.owner_email !== USER) return [false, `pero quedó a nombre de ${spot.owner_email}`]
    return [true, `lugar guardado, ${spot.images.length} foto${spot.images.length !== 1 ? "s" : ""}`]
  }
  if (flow.expect.contribution) {
    const found = (await apiGet("/admin/contributions", ADMIN)).find(c => c.title?.includes(flow.expect.contribution))
    return found ? [true, `aporte en revisión: «${found.title}»`] : [false, "pero el aporte no está en revisión"]
  }
  return [true, ""]
}

export async function run(browser, r) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await loggedIn(ctx, USER)
  const uploads = await fakeCloudinary(ctx)
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", e => errors.push(e.message))

  for (const flow of FLOWS) {
    try {
      const title = (await flow.fill(page))?.trim()
      if (title !== flow.expect.title) {
        await shot(page, `falla-${flow.name.replace(/\W+/g, "-")}`)
        r.ok(`Formulario — ${flow.name}`, false, `terminó en «${title}», se esperaba «${flow.expect.title}»`)
        continue
      }
      const [ok, detail] = await saved(flow)
      r.ok(`Formulario — ${flow.name}`, ok, detail)
    } catch (e) {
      await shot(page, `falla-${flow.name.replace(/\W+/g, "-")}`)
      r.ok(`Formulario — ${flow.name}`, false, e.message.split("\n")[0])
    }
  }

  r.ok("Formulario — fotos subidas a Cloudinary (simulado)", uploads.length > 0, `${uploads.length}`)

  await profile(page, r)
  r.ok("Cuenta — sin errores de JavaScript", errors.length === 0, errors.slice(0, 2).join(" | "))
  await ctx.close()

  await admin(browser, r)
}

const text = page => page.locator("main, body").first().textContent()
async function open(page, path) {
  await page.goto(`${FRONT}${path}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(500)
}

// El perfil, con lo que se cargó en el formulario.
async function profile(page, r) {
  const spots = FLOWS.filter(f => f.expect.spot).map(f => f.expect.spot)
  const contributions = FLOWS.filter(f => f.expect.contribution).map(f => f.expect.contribution)

  await open(page, "/profile/lugares")
  let body = await text(page)
  const missingSpots = spots.filter(n => !body.includes(n))
  r.ok("Perfil — «Lugares que administrás» muestra los lugares cargados", missingSpots.length === 0,
    missingSpots.length ? `faltan: ${missingSpots.join(", ")}` : `${spots.length} lugares`)
  await shot(page, "perfil-lugares")

  await open(page, "/profile/aportes")
  body = await text(page)
  const missingContribs = contributions.filter(n => !body.includes(n))
  r.ok("Perfil — «Mis aportes» muestra los aportes en revisión", missingContribs.length === 0,
    missingContribs.length ? `faltan: ${missingContribs.join(", ")}` : `${contributions.length} aportes`)
  await shot(page, "perfil-aportes")

  // Panel de un lugar propio.
  const camping = (await apiGet("/admin/spots", ADMIN)).find(sp => sp.name === named("Camping E2E"))
  await open(page, `/dashboard/spots/${camping.id}`)
  r.ok("Perfil — el panel de un lugar propio abre", await page.getByRole("heading", { name: named("Camping E2E") }).count() > 0)
  await shot(page, "perfil-panel-lugar")

  // Favorito y reseña en un lugar publicado: aparecen en el perfil.
  await open(page, "/spots/cerro-de-prueba")
  await page.getByRole("button", { name: /Guardar/ }).first().click()
  await page.getByRole("button", { name: /Escribir review/ }).click()
  await page.getByLabel("5 estrellas").check({ force: true })
  await page.getByPlaceholder("Contá tu experiencia (opcional)...").fill("Muy lindo, prueba e2e.")
  await page.getByRole("button", { name: "Publicar review" }).click()
  await page.waitForTimeout(1000)
  await open(page, "/favorites")
  r.ok("Perfil — el favorito aparece en Favoritos", (await text(page)).includes("Cerro de Prueba"))
  await shot(page, "perfil-favoritos")
  await open(page, "/reviews")
  body = await text(page)
  r.ok("Perfil — la reseña aparece en Mis reseñas", body.includes("Cerro de Prueba") && body.includes("Muy lindo, prueba e2e."))
  await shot(page, "perfil-resenias")

  // El admin aprueba un aporte: le llega la notificación.
  const sector = (await apiGet("/admin/contributions", ADMIN)).find(c => c.title?.includes(named("Sector Sur E2E")))
  await apiPost(`/admin/contributions/${sector.id}/approve`, ADMIN)
  await open(page, "/notificaciones")
  r.ok("Perfil — la aprobación de un aporte llega a Notificaciones", (await text(page)).includes(named("Sector Sur E2E")))
  await shot(page, "perfil-notificaciones")

  await open(page, "/profile")
  r.ok("Perfil — la portada abre con el nombre", await page.getByText(USER).count() > 0)
  await shot(page, "perfil")
}

// El panel de admin con la cuenta de admin de prueba.
async function admin(browser, r) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await loggedIn(ctx, ADMIN)
  await fakeCloudinary(ctx)
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", e => errors.push(e.message))

  await open(page, "/admin")
  const nuevos = page.getByRole("button", { name: /^🆕 Lugares nuevos/ })
  r.ok("Admin — el resumen abre y cuenta los lugares nuevos", /\(\d+\)/.test(await nuevos.textContent()), await nuevos.textContent())
  await shot(page, "admin-resumen")

  await nuevos.click()
  await page.waitForTimeout(800)
  const name = named("Glamping E2E")
  const row = page.locator(".spot-row").filter({ hasText: name })
  r.ok("Admin — «Lugares nuevos» lista lo cargado", await row.count() === 1)
  await row.getByRole("button", { name: "Aprobar" }).click()
  await page.waitForTimeout(800)
  const spot = (await apiGet("/admin/spots", ADMIN)).find(sp => sp.name === name)
  r.ok("Admin — aprobar un lugar lo publica", spot?.is_approved === true)

  await page.getByRole("button", { name: /^🏄 Escuelas y servicios/ }).click()
  await page.waitForTimeout(800)
  r.ok("Admin — «Escuelas y servicios» lista la escuela cargada", (await text(page)).includes(named("Escuela E2E")))
  await shot(page, "admin-escuelas")

  r.ok("Admin — sin errores de JavaScript", errors.length === 0, errors.slice(0, 2).join(" | "))
  await ctx.close()
}
