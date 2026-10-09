import { describe, expect, it } from "vitest"
import { gradeVariant, routeStats, sectorStats, type TrekkingRoute } from "./trailPage"
import type { SectorDetail } from "./types"

const route = (extra: Partial<TrekkingRoute>): TrekkingRoute => ({
  id: 1, name: "R", slug: "r", distance_km: null, duration_hours: null, difficulty: null,
  elevation_gain: null, elevation_loss: null, max_altitude: null, min_altitude: null,
  route_type: null, technical_level: null, physical_demand: null, description: null, ...extra,
})

describe("Datos de rutas y sectores", () => {
  it("ruta: solo lo que se sabe, coma decimal", () => {
    expect(routeStats(route({ distance_km: 7.5, elevation_gain: 420 })).map(s => `${s.label}: ${s.value}`))
      .toEqual(["Distancia: 7,5 km", "Desnivel +: 420 m"])
    expect(routeStats(route({}))).toEqual([])
  })

  it("sector: vías, graduación (un solo grado sin rango) y lo que se sabe", () => {
    const sector = { routes_count: 1, min_grade: "6a", max_grade: "6a", approach_minutes: null, sun_exposure: "sombra", rock_type: null, max_altitude: null } as SectorDetail
    expect(sectorStats(sector).map(s => `${s.label}: ${s.value}`)).toEqual(["Vías: 1 vía", "Graduación: 6a", "Sol o sombra: Sombra"])
  })

  it("color del grado", () => {
    expect([gradeVariant("5"), gradeVariant("6a+"), gradeVariant("7b"), gradeVariant("8a"), gradeVariant("V4"), gradeVariant(null)])
      .toEqual(["green", "yellow", "orange", "red", "yellow", "muted"])
  })
})
