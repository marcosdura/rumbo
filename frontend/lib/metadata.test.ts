import { describe, expect, it } from "vitest"
import { routeDescription, sectorDescription } from "./metadata"

describe("routeDescription", () => {
  it("con todos los datos", () => {
    expect(routeDescription({ name: "Arequita", distance_km: 5.5, duration_hours: 2, difficulty: "moderado" }))
      .toBe("Ruta de trekking: 5.5 km, 2 h, dificultad moderado.")
  })

  it("solo con lo que hay", () => {
    expect(routeDescription({ name: "Arequita", distance_km: 3, duration_hours: null, difficulty: null }))
      .toBe("Ruta de trekking: 3 km.")
  })

  it("sin datos (o sin ruta), una genérica en vez de undefined", () => {
    expect(routeDescription({})).toBe("Ruta de trekking en Uruguay.")
    expect(routeDescription(null)).toBe("Ruta de trekking en Uruguay.")
  })
})

describe("sectorDescription", () => {
  it("usa routes_count, que es lo que manda el backend", () => {
    expect(sectorDescription({ name: "Norte", routes_count: 12, min_grade: "5a", max_grade: "7b" }))
      .toBe("Sector de escalada: 12 vías, graduación 5a–7b.")
  })

  it("una sola vía y una sola graduación", () => {
    expect(sectorDescription({ name: "Norte", routes_count: 1, min_grade: "6a", max_grade: "6a" }))
      .toBe("Sector de escalada: 1 vía, graduación 6a.")
  })

  it("sin vías, una genérica", () => {
    expect(sectorDescription({ name: "Norte", routes_count: 0, min_grade: null, max_grade: null }))
      .toBe("Sector de escalada en Uruguay.")
    expect(sectorDescription(null)).toBe("Sector de escalada en Uruguay.")
  })
})
