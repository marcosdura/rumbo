import { describe, expect, it } from "vitest"
import {
  CAMPING_CODEC, CLIMBING_CODEC, KAYAK_CODEC, SURF_CODEC, TREKKING_CODEC,
  filterChips, listQuery, sortOf, toSearchParams, withPanelFilters, withPractical, withSort, withoutActivity, withoutFilters,
} from "./searchFilters"
import { widerSearch, widerLabel } from "./searchFilters"
import { CAMPING_AMENITY_GROUPS } from "./camping-filters"
import { TREKKING_FILTERS } from "./trekking-filters"

const roundTrip = <T,>(codec: { fromParams: (p: URLSearchParams) => T; toParams: (s: T, p: URLSearchParams) => void }, state: T) => {
  const p = new URLSearchParams()
  codec.toParams(state, p)
  return codec.fromParams(p)
}

describe("cada panel va y vuelve igual por la URL", () => {
  it("trekking, kayak, surf, escalada y camping", () => {
    const trekking = { difficulties: ["fácil"], durations: ["corta"], distances: ["larga"], amenities: { parking: true } } as never
    expect(roundTrip(TREKKING_CODEC, trekking)).toEqual(trekking)
    const kayak = { waterTypes: ["rio"], difficulties: ["facil"], durations: [], rentalAvailable: true }
    expect(roundTrip(KAYAK_CODEC, kayak)).toEqual(kayak)
    const surf = { classTypes: ["grupal"], durations: ["media"], equipmentIncluded: false, hasSurfSchool: true } as never
    expect(roundTrip(SURF_CODEC, surf)).toEqual(surf)
    const climbing = { types: ["boulder"], gradeRanges: ["experto"], hasRestrictions: true } as never
    expect(roundTrip(CLIMBING_CODEC, climbing)).toEqual(climbing)
    const camping = { amenityIds: [22, 27], priceRanges: ["gratis"] } as never
    expect(roundTrip(CAMPING_CODEC, camping)).toEqual(camping)
  })
})

describe("cambios a la URL", () => {
  it("aplicar el panel reemplaza sus filtros y deja los demás", () => {
    const p = new URLSearchParams("activity=Trekking&department=Rocha&difficulty=fácil&pet_friendly=true&sort=name")
    const next = withPanelFilters(p, "Trekking", { difficulties: ["difícil"], durations: [], distances: [], amenities: {} } as never)
    expect(next.toString()).toBe(new URLSearchParams("activity=Trekking&department=Rocha&pet_friendly=true&sort=name&difficulty=difícil").toString())
  })

  it("prácticos y orden", () => {
    const p = new URLSearchParams("activity=Camping")
    expect(withPractical(p, "pet_friendly", true).get("pet_friendly")).toBe("true")
    expect(withPractical(new URLSearchParams("pet_friendly=true"), "pet_friendly", false).has("pet_friendly")).toBe(false)
    // Recomendados es el orden por defecto: no ensucia la URL.
    expect(withSort(new URLSearchParams("sort=name"), "recommended").has("sort")).toBe(false)
    expect(sortOf(new URLSearchParams("sort=cualquiera"))).toBe("recommended")
  })
})

describe("el texto buscado (q, campo Dónde)", () => {
  it("queda al aplicar el panel, al limpiar filtros y al quitar la actividad, y no es un chip más", () => {
    const p = new URLSearchParams("activity=Trekking&q=cascada&difficulty=fácil")
    expect(withPanelFilters(p, "Trekking", { difficulties: [], durations: [], distances: [], amenities: {} }).get("q")).toBe("cascada")
    expect(withoutFilters(p).toString()).toBe("activity=Trekking&q=cascada")
    expect(withoutActivity(p).toString()).toBe("q=cascada")
    expect(filterChips(p).map(c => c.key)).toEqual(["difficulty"])
  })
})

describe("chips", () => {
  it("con etiquetas legibles; sin actividad, departamento ni orden", () => {
    const p = new URLSearchParams("activity=Camping&department=Rocha&sort=rating&price_range=gratis&amenity_ids=22&cell_signal=true&parking=true")
    expect(filterChips(p).map(c => c.label)).toEqual(["Precio: Gratis", "WiFi", "📶 Con señal", "🅿️ Estacionamiento"])
  })

  it("mascotas ya no está en los paneles: es un filtro rápido para todos", () => {
    const campingLabels = CAMPING_AMENITY_GROUPS.flatMap(g => g.amenities.map(a => a.label as string))
    expect(campingLabels).not.toContain("Acepta mascotas")
    expect(TREKKING_FILTERS.amenities.map(a => a.key as string)).not.toContain("pet_friendly")
  })
})

describe("el pedido a GET /spots", () => {
  it("la URL tal cual, con el orden siempre explícito y la tanda", () => {
    const q = new URLSearchParams(listQuery(new URLSearchParams("activity=Trekking&difficulty=fácil"), 24))
    expect(Object.fromEntries(q)).toEqual({ activity: "Trekking", difficulty: "fácil", sort: "recommended", limit: "24", offset: "24" })
    expect(new URLSearchParams(listQuery(new URLSearchParams("sort=rating"))).get("sort")).toBe("rating")
  })

  it("los searchParams del servidor quedan igual que en el navegador (también los repetidos)", () => {
    const p = toSearchParams({ activity: "Trekking", difficulty: ["fácil", "difícil"], vacio: undefined })
    expect(p.toString()).toBe(new URLSearchParams("activity=Trekking&difficulty=fácil&difficulty=difícil").toString())
  })
})

describe("búsqueda más amplia cuando no hay resultados", () => {
  it("saca el departamento y el nombre; deja la actividad y el orden", () => {
    expect(widerSearch(new URLSearchParams("activity=Escalada&department=Rivera&sort=new"))?.toString()).toBe("activity=Escalada&sort=new")
    expect(widerSearch(new URLSearchParams("q=arequita"))?.toString()).toBe("")
    expect(widerSearch(new URLSearchParams("activity=Escalada"))).toBeNull()
  })

  it("dice cuántos y de qué", () => {
    expect(widerLabel("Escalada", 2)).toBe("Ver los 2 lugares de Escalada en todo Uruguay")
    expect(widerLabel("Surf", 1)).toBe("Ver el lugar de Surf en todo Uruguay")
    expect(widerLabel("", 5)).toBe("Ver los 5 lugares en todo Uruguay")
  })
})
