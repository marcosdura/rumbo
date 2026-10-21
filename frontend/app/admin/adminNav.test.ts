import { describe, expect, it } from "vitest"
import { listsFor, sectionTitle, splitByOwner, tabCounts, visibleSpots } from "./adminNav"
import type { AdminSpot } from "./types"
import type { AdminSummary } from "./SummaryTab"

const spot = (id: number, extra: Partial<AdminSpot> = {}) => ({
  id, name: `Lugar ${id}`, department: "Rocha", category: { name: "Camping" }, owner_email: "a@test.com",
  is_approved: true, created_at: `2026-10-0${id}T10:00:00Z`, images: [], owner_deleted_at: null,
  rejection_reason: null, rejected_at: null, ...extra,
}) as unknown as AdminSpot

describe("navegación del panel", () => {
  it("el título es la sección, sin el emoji", () => {
    expect(sectionTitle("resumen")).toBe("Resumen")
    expect(sectionTitle("cambios")).toBe("Cambios y aportes")
    expect(sectionTitle("importar-vias")).toBe("Importar vías")
  })

  it("cada pestaña pide solo su lista", () => {
    expect(listsFor("fotos")).toEqual({ spots: true, cambios: false, reportes: false, reclamos: false })
    expect(listsFor("reportes")).toEqual({ spots: false, cambios: false, reportes: true, reclamos: false })
    expect(listsFor("resumen")).toEqual({ spots: false, cambios: false, reportes: false, reclamos: false })
  })
})

describe("la lista de lugares", () => {
  it("los de cuentas borradas van aparte, los más viejos primero", () => {
    const { active, deactivated } = splitByOwner([
      spot(1), spot(2, { owner_deleted_at: "2026-10-09T00:00:00Z" }), spot(3, { owner_deleted_at: "2026-10-02T00:00:00Z" }),
    ])
    expect(active.map(s => s.id)).toEqual([1])
    expect(deactivated.map(s => s.id)).toEqual([3, 2])
  })

  it("filtra por estado, busca por nombre, departamento, categoría o email y ordena", () => {
    const spots = [
      spot(1, { name: "Zeta" }), spot(2, { name: "Alfa", is_approved: false }),
      spot(3, { name: "Beta", department: "Lavalleja", owner_email: "dueno@x.com" }),
    ]
    expect(visibleSpots(spots, "all", "", "name").map(s => s.name)).toEqual(["Alfa", "Beta", "Zeta"])
    expect(visibleSpots(spots, "all", "", "date_desc").map(s => s.id)).toEqual([3, 2, 1])
    expect(visibleSpots(spots, "pending", "", "name").map(s => s.name)).toEqual(["Alfa"])
    expect(visibleSpots(spots, "all", "lavalleja", "name").map(s => s.name)).toEqual(["Beta"])
    expect(visibleSpots(spots, "all", "DUENO@", "name").map(s => s.name)).toEqual(["Beta"])
  })
})

describe("contadores de las pestañas", () => {
  const summary = { queues: {
    new_spots: { count: 4 }, changes: { count: 2 }, contributions: { count: 3 }, reports: { count: 1 }, claims: { count: 0 },
  } } as unknown as AdminSummary
  const none = { loaded: false, count: 0 }

  it("sin abrir la pestaña, los del resumen", () => {
    expect(tabCounts(summary, { spots: { loaded: false, pending: 0, deactivated: 0 }, cambios: none, reportes: none, reclamos: none }))
      .toEqual({ nuevos: 4, cambios: 5, reportes: 1, reclamos: 0, "cuentas-eliminadas": undefined })
  })

  it("con la lista cargada, los de la lista", () => {
    expect(tabCounts(summary, {
      spots: { loaded: true, pending: 1, deactivated: 2 }, cambios: { loaded: true, count: 7 },
      reportes: { loaded: true, count: 0 }, reclamos: none,
    })).toEqual({ nuevos: 1, cambios: 7, reportes: 0, reclamos: 0, "cuentas-eliminadas": 2 })
  })
})
