import { describe, expect, it } from "vitest"
import {
  CAMPING_CODEC, CLIMBING_CODEC, KAYAK_CODEC, SURF_CODEC, TREKKING_CODEC,
  filterChips, sortOf, withPanelFilters, withPractical, withSort,
} from "./searchFilters"
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
