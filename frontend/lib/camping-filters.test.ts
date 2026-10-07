import { describe, expect, it } from "vitest"
import { CAMPING_AMENITY_GROUPS, EMPTY_CAMPING_FILTERS, countActiveCampingFilters } from "./camping-filters"

describe("filtros de camping", () => {
  it("mascotas ya no es un amenity: es un filtro propio", () => {
    const labels = CAMPING_AMENITY_GROUPS.flatMap(g => g.amenities.map(a => a.label))
    expect(labels).not.toContain("Acepta mascotas")
    expect(countActiveCampingFilters({ ...EMPTY_CAMPING_FILTERS, petFriendly: true })).toBe(1)
  })
})
