import { describe, expect, it } from "vitest"
import { instagramLink, projector, trackPath, type LatLng } from "./blogShare"

describe("links para Instagram", () => {
  it("con utm para saber de dónde vino cada visita", () => {
    const url = new URL(instagramLink("/blog/refugios", "historia", "refugios", "https://rumboapp.uy"))
    expect(url.origin + url.pathname).toBe("https://rumboapp.uy/blog/refugios")
    expect(Object.fromEntries(url.searchParams)).toEqual({ utm_source: "instagram", utm_medium: "historia", utm_campaign: "refugios" })
  })
})

describe("el mapa de la historia", () => {
  it("entra en el rectángulo, con el norte arriba", () => {
    const pts: LatLng[] = [[-41.1, -71.5], [-41.2, -71.4]]
    const project = projector(pts, 400, 300, 20)
    const a = project(pts[0])
    const b = project(pts[1])
    for (const p of [a, b]) {
      expect(p.x).toBeGreaterThanOrEqual(20)
      expect(p.x).toBeLessThanOrEqual(380)
      expect(p.y).toBeGreaterThanOrEqual(20)
      expect(p.y).toBeLessThanOrEqual(280)
    }
    // El primero está más al norte (arriba) y más al oeste (izquierda).
    expect(a.y).toBeLessThan(b.y)
    expect(a.x).toBeLessThan(b.x)
  })

  it("un solo punto va al centro", () => {
    expect(projector([[-34, -55]], 400, 300)([-34, -55])).toEqual({ x: 200, y: 150 })
  })

  it("el recorrido como path de SVG", () => {
    const pts: LatLng[] = [[0, 0], [0, 1], [1, 1]]
    expect(trackPath(pts, projector(pts, 100, 100, 0))).toMatch(/^M\S+ \S+ L\S+ \S+ L\S+ \S+$/)
    expect(trackPath([[0, 0]], projector([[0, 0]], 10, 10))).toBe("")
  })
})
