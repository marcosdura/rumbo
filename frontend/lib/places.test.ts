import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }), useSearchParams: () => new URLSearchParams() }))

const {
  ACTIVITIES, activitiesIn, activityHref, departmentHref, departmentsWith, findActivity, findDepartment,
  placesHeading, placesJsonLd, placesMetadata, placesPath, placesPaths, searchMetadata, searchPath,
} = await import("./places")
const { activities } = await import("@/components/spots/SearchBar") as unknown as { activities: string[] }

const camping = findActivity("camping")!
const trekking = findActivity("trekking")!
const rocha = findDepartment("rocha")!
const counts = [
  { activity: "Camping", department: "Rocha", count: 3 },
  { activity: "Trekking", department: "Rocha", count: 1 },
  { activity: "Camping", department: "Paysandú", count: 2 },
]

describe("páginas /lugares", () => {
  it("las actividades son las del buscador (si no, la página no encuentra nada)", () => {
    expect(ACTIVITIES.map(a => a.name).sort()).toEqual([...activities].sort())
  })

  it("los departamentos tienen dirección sin tildes ni espacios", () => {
    expect(findDepartment("paysandu")?.name).toBe("Paysandú")
    expect(findDepartment("treinta-y-tres")?.name).toBe("Treinta y Tres")
    expect(findDepartment("narnia")).toBeNull()
    expect(findActivity("rocha")).toBeNull()
  })

  it("direcciones y títulos", () => {
    expect(placesPath(camping, null)).toBe("/lugares/camping")
    expect(placesPath(null, rocha)).toBe("/lugares/rocha")
    expect(placesPath(camping, rocha)).toBe("/lugares/camping/rocha")
    expect(placesHeading(camping, null)).toBe("Camping en Uruguay")
    expect(placesHeading(null, rocha)).toBe("Lugares en Rocha")
    expect(placesHeading(camping, rocha)).toBe("Camping en Rocha")
    expect(searchPath(camping, rocha)).toBe("/search?activity=Camping&department=Rocha")
  })

  it("los links entre páginas solo van a donde hay lugares, con cuántos", () => {
    expect(departmentsWith(counts, camping).map(d => [d.name, d.count])).toEqual([["Paysandú", 2], ["Rocha", 3]])
    expect(activitiesIn(counts, rocha).map(a => [a.name, a.count])).toEqual([["Camping", 3], ["Trekking", 1]])
    expect(departmentsWith(counts, findActivity("surf")!)).toEqual([])
  })

  it("el sitemap: cada actividad siempre, y departamentos y combinaciones solo con lugares", () => {
    const paths = placesPaths(counts)
    for (const a of ACTIVITIES) expect(paths).toContain(`/lugares/${a.slug}`)
    expect(paths).toEqual(expect.arrayContaining(["/lugares/rocha", "/lugares/paysandu", "/lugares/camping/rocha", "/lugares/trekking/rocha", "/lugares/camping/paysandu"]))
    expect(paths).not.toContain("/lugares/trekking/paysandu")
    expect(paths).not.toContain("/lugares/artigas")
    expect(new Set(paths).size).toBe(paths.length)
    expect(placesPaths([])).toHaveLength(ACTIVITIES.length)
  })

  it("los links de otras páginas, por nombre", () => {
    expect(activityHref("Trekking", "Rocha")).toBe("/lugares/trekking/rocha")
    expect(activityHref("Trekking")).toBe("/lugares/trekking")
    expect(activityHref("Trekking", "Narnia")).toBe("/lugares/trekking")
    expect(activityHref("Buceo")).toBe("/search?activity=Buceo")
    expect(departmentHref("Treinta y Tres")).toBe("/lugares/treinta-y-tres")
    expect(departmentHref("Narnia")).toBe("/search?department=Narnia")
  })

  it("metadata: título, descripción y canónica", () => {
    const m = placesMetadata(camping, rocha)
    expect(m.title).toBe("Camping en Rocha | Rumbo")
    expect(m.description.startsWith("Camping en Rocha. Campings para armar la carpa")).toBe(true)
    expect(m.alternates.canonical).toBe("/lugares/camping/rocha")
    expect(placesMetadata(null, rocha).description.startsWith("Lugares en Rocha:")).toBe(true)
  })

  it("datos estructurados: migas de pan y la lista de lugares", () => {
    const [crumbs, list] = placesJsonLd(trekking, rocha, [{ name: "Cerro", slug: "cerro" }, { name: "Sin slug", slug: null }])
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Inicio", "Trekking en Uruguay", "Trekking en Rocha"])
    expect(list.itemListElement).toEqual([{ "@type": "ListItem", position: 1, name: "Cerro", url: "https://rumboapp.uy/spots/cerro" }])
    expect(placesJsonLd(trekking, null, [])[0].itemListElement).toHaveLength(2)
  })

  it("la búsqueda: título según el filtro y fuera de Google (siguiendo sus links)", () => {
    expect(searchMetadata({ activity: "Camping", department: "Rocha" }).title).toBe("Buscar: Camping en Rocha | Rumbo")
    expect(searchMetadata({ department: ["Rocha"] }).title).toBe("Buscar: Lugares en Rocha | Rumbo")
    expect(searchMetadata({ activity: "<script>" }).title).toBe("Buscar lugares | Rumbo")
    expect(searchMetadata({}).robots).toEqual({ index: false, follow: true })
    expect(searchMetadata({ q: " cascada ", department: "Rocha" }).title).toBe("Buscar «cascada» | Rumbo")
  })
})
