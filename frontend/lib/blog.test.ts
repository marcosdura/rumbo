import { describe, expect, it } from "vitest"
import {
  parseInline, parseRichText, publishedLabel, resolvePoints, safeHref, splitFeatured, trackStats,
  type BlogMapData, type BlogSpot, type BlogSummary,
} from "./blog"

describe("Texto con formato", () => {
  it("negrita, cursiva y links", () => {
    expect(parseInline("Es **lindo** y *tranquilo*, mirá [el lugar](/spots/cabo).")).toEqual([
      { t: "text", v: "Es " }, { t: "b", v: "lindo" }, { t: "text", v: " y " }, { t: "i", v: "tranquilo" },
      { t: "text", v: ", mirá " }, { t: "link", v: "el lugar", href: "/spots/cabo" }, { t: "text", v: "." },
    ])
  })

  it("un link peligroso queda como texto", () => {
    expect(parseInline("[clic](javascript:alert(1))")[0]).toEqual({ t: "text", v: "clic" })
    expect(safeHref("//evil.com")).toBeNull()
    expect(safeHref("data:text/html,x")).toBeNull()
    expect(safeHref("https://wikiloc.com/ruta")).toBe("https://wikiloc.com/ruta")
  })

  it("párrafos, saltos de línea y listas", () => {
    const blocks = parseRichText("Primero\nsigue igual\n\n- Uno\n- **Dos**\n\nFin")
    expect(blocks.map(b => b.kind)).toEqual(["p", "ul", "p"])
    expect(blocks[0]).toEqual({ kind: "p", inline: [{ t: "text", v: "Primero" }, { t: "br" }, { t: "text", v: "sigue igual" }] })
    expect(blocks[1]).toEqual({ kind: "ul", items: [[{ t: "text", v: "Uno" }], [{ t: "b", v: "Dos" }]] })
  })
})

describe("Puntos del mapa", () => {
  const spot = { id: 7, name: "Cerro Arequita", slug: "cerro-arequita", lat: -34.28, lng: -55.26, categories: [{ name: "Trekking" }] } as unknown as BlogSpot
  const map: BlogMapData = {
    points: [
      { id: "frey", name: "Refugio Frey", type: "refugio", lat: -41.18, lng: -71.47, note: null, image: null, url: null },
      { id: "gone", spot_id: 99, note: null },
      { id: "arequita", spot_id: 7, note: "Subida corta" },
    ],
    tracks: [],
  }

  it("numera en orden, con lugares de Rumbo y puntos libres", () => {
    const points = resolvePoints(map, { "7": spot })
    expect(points.map(p => [p.number, p.name, p.emoji, p.href])).toEqual([
      [1, "Refugio Frey", "🛖", null],
      [2, "Cerro Arequita", "🥾", "/spots/cerro-arequita"],
    ])
    expect(points[1].note).toBe("Subida corta")
  })

  it("sin mapa, nada", () => {
    expect(resolvePoints(null, {})).toEqual([])
  })
})

describe("Lo demás", () => {
  it("la destacada primero; si no hay, la más nueva", () => {
    const a = { slug: "a", featured: false } as BlogSummary
    const b = { slug: "b", featured: true } as BlogSummary
    expect(splitFeatured([a, b])).toEqual({ featured: b, rest: [a] })
    expect(splitFeatured([a]).featured).toBe(a)
    expect(splitFeatured([])).toEqual({ featured: null, rest: [] })
  })

  it("datos del recorrido solo con lo que hay", () => {
    expect(trackStats({ distance_km: 12.34, elevation_gain: 700, elevation_loss: null })).toEqual(["12,3 km", "↗ 700 m"])
  })

  it("fecha en castellano", () => {
    expect(publishedLabel("2026-11-11T15:00:00Z")).toBe("11 de noviembre de 2026")
    expect(publishedLabel(null)).toBeNull()
  })
})
