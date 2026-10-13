import { describe, expect, it } from "vitest"
import { breadcrumb, metaDescription, pageTitle, richTitle, shareImages, socialMetadata, spotFallbackDescription, spotTitle } from "./seo"

describe("títulos", () => {
  it("sin espacios de más (antes 'Sendero Norte  | Rumbo')", () => {
    expect(pageTitle("Sendero Norte ")).toBe("Sendero Norte | Rumbo")
    expect(pageTitle("  Área   protegida ")).toBe("Área protegida | Rumbo")
    expect(pageTitle(null)).toBe("Rumbo")
  })
})

describe("títulos con la actividad y el lugar", () => {
  const spot = (name: string, category: string, extra: Record<string, unknown> = {}) =>
    ({ name, department: "Rocha", category: { name: category }, ...extra })

  it("suma la actividad y el departamento", () => {
    expect(spotTitle(spot("Laguna Negra", "Camping"))).toBe("Laguna Negra — Camping en Rocha | Rumbo")
  })

  it("si el nombre ya dice la actividad no la repite (sin importar tildes ni mayúsculas)", () => {
    expect(spotTitle(spot("Camping Santa Teresa", "Camping"))).toBe("Camping Santa Teresa — Rocha | Rumbo")
    expect(richTitle("ESCALADA en Cerro", { activity: "Escalada", keyword: "escalada", place: "Lavalleja" })).toBe("ESCALADA en Cerro — Lavalleja | Rumbo")
  })

  it("distingue la escuela de surf de la playa", () => {
    expect(spotTitle(spot("Ola Brava", "Surf", { surf_detail: {} }))).toBe("Ola Brava — Escuela de surf en Rocha | Rumbo")
    expect(spotTitle(spot("Playa El Emir", "Surf", { surf_detail: null }))).toBe("Playa El Emir — Surf en Rocha | Rumbo")
  })

  it("sin departamento, solo la actividad", () => {
    expect(spotTitle({ name: "Cascada", category: { name: "Trekking" } })).toBe("Cascada — Trekking | Rumbo")
  })

  it("si no entra en 60 caracteres saca primero el lugar y después la actividad", () => {
    const largo = "Sendero de los Cerros y las Quebradas"
    expect(richTitle(largo, { activity: "Trekking", place: "Lavalleja" })).toBe(`${largo} — Trekking | Rumbo`)
    const muyLargo = "Sendero de los Cerros, las Quebradas y los Arroyos"
    expect(richTitle(muyLargo, { activity: "Trekking", place: "Lavalleja" })).toBe(`${muyLargo} | Rumbo`)
    for (const t of [richTitle(largo, { activity: "Trekking", place: "Lavalleja" })]) expect(t.length).toBeLessThanOrEqual(60)
  })

  it("sin nombre, Rumbo", () => {
    expect(richTitle("  ", { activity: "Camping", place: "Rocha" })).toBe("Rumbo")
  })
})

describe("descripciones", () => {
  it("cortas, quedan igual", () => {
    expect(metaDescription("  Un lugar lindo. ")).toBe("Un lugar lindo.")
  })

  it("largas, se cortan en una palabra completa con … y sin pasar de 160", () => {
    const text = "Spot de surf urbano a pocos metros de la Península de Punta del Este. Las rocas cercanas generan rompientes interesantes que lo hacen uno de los puntos más frecuentados por surfers locales."
    const d = metaDescription(text)
    expect(d.length).toBeLessThanOrEqual(160)
    expect(d.endsWith("…")).toBe(true)
    expect(d).not.toMatch(/frec…$/)
    expect(text.startsWith(d.slice(0, -1))).toBe(true)
  })

  it("un lugar sin descripción tiene una armada con sus actividades y departamento", () => {
    expect(spotFallbackDescription({ name: "Playa Sur", department: "Rocha", categories: [{ name: "Surf" }] }))
      .toBe("Playa Sur: Surf en Rocha. Información práctica, fotos y reseñas en Rumbo.")
    expect(spotFallbackDescription({ name: "Cerro" })).toBe("Cerro: Lugar al aire libre en Uruguay. Información práctica, fotos y reseñas en Rumbo.")
  })
})

describe("compartir", () => {
  it("sin foto, la imagen de Rumbo (antes salía sin imagen)", () => {
    expect(shareImages(null)[0].url).toBe("/opengraph-image")
    expect(shareImages("https://res.cloudinary.com/x.jpg")[0].url).toBe("https://res.cloudinary.com/x.jpg")
  })

  it("canónica y og:url con la dirección de la página", () => {
    const m = socialMetadata({ title: "T", description: "D", path: "/spots/cabo" })
    expect(m.alternates.canonical).toBe("/spots/cabo")
    expect(m.openGraph.url).toBe("/spots/cabo")
    expect(m.twitter.card).toBe("summary_large_image")
  })
})

describe("migas de pan", () => {
  it("Inicio › lugar › ruta, con direcciones completas", () => {
    const b = breadcrumb([{ name: "Cerro Arequita", path: "/spots/arequita" }, { name: "Cumbre ", path: "/spots/arequita/rutas/cumbre" }])
    expect(b.itemListElement.map(i => [i.position, i.name, i.item])).toEqual([
      [1, "Inicio", "https://rumboapp.uy/"],
      [2, "Cerro Arequita", "https://rumboapp.uy/spots/arequita"],
      [3, "Cumbre", "https://rumboapp.uy/spots/arequita/rutas/cumbre"],
    ])
  })
})
