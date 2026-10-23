import { describe, expect, it, vi } from "vitest"

// Leaflet necesita un DOM real; acá solo se prueba el HTML del popup.
vi.mock("react-leaflet", () => ({ MapContainer: () => null, TileLayer: () => null, useMap: () => ({}) }))
vi.mock("leaflet", () => ({ default: { divIcon: (opts: unknown) => opts, latLngBounds: () => ({}) } }))
vi.mock("leaflet.markercluster", () => ({}))
vi.mock("leaflet/dist/leaflet.css", () => ({}))
vi.mock("leaflet.markercluster/dist/MarkerCluster.css", () => ({}))
vi.mock("leaflet.markercluster/dist/MarkerCluster.Default.css", () => ({}))

const { createPopupHtml, createPillIcon, PIN_POPUP_OFFSET } = await import("./SpotsMap")
const { readFileSync } = await import("node:fs")

describe("popup del mapa", () => {
  it("abre el lugar en la misma pestaña y escapa el nombre", () => {
    const html = createPopupHtml({ slug: "cascada", name: "<b>Cascada</b>", department: "Rocha" }, [{ name: "Camping" }])
    expect(html).toContain('href="/spots/cascada"')
    expect(html).not.toContain("_blank")
    expect(html).toContain("&lt;b&gt;Cascada&lt;/b&gt;")
  })
})

describe("pins del mapa", () => {
  it("dicen el nombre del lugar (no la categoría), escapado y acortado si es largo", () => {
    const pin = (name: string) => (createPillIcon("Camping", [], false, false, name) as unknown as { html: string }).html
    expect(pin("Parque del picaflor")).toContain("Parque del picaflor")
    expect(pin("Parque del picaflor")).not.toMatch(/<\/span>\s*Camping/)
    expect(pin("<b>x</b>")).toContain("&lt;b&gt;x&lt;/b&gt;")
    const long = pin("Área protegida Parque Nacional Esteros de Farrapos")
    expect(long).toContain("Área protegida Parque…")
    expect(long).not.toContain("Farrapos")
  })

  it("la ubicación es el centro de la pastilla, sea cual sea su largo (antes, su borde izquierdo)", () => {
    const icon = createPillIcon("Camping", [], false, false) as unknown as { html: string; iconAnchor: number[]; iconSize: number[]; popupAnchor: number[] }
    expect(icon.iconAnchor).toEqual([0, 0])
    expect(icon.iconSize).toEqual([0, 0])
    expect(icon.html).toMatch(/class="spot-pin"[^>]*transform: translate\(-50%, -50%\)/)
  })

  it("el globo sale justo arriba del pin (antes, 60 px a la derecha) y crece desde él", () => {
    const icon = createPillIcon("Surf", ["Kayak"], true, true) as unknown as { popupAnchor: number[] }
    expect(icon.popupAnchor).toEqual([0, PIN_POPUP_OFFSET])
    const src = readFileSync("components/spots/SpotsMap.jsx", "utf-8")
    expect(src).toMatch(/\.leaflet-popup-content-wrapper, \.leaflet-popup-tip-container \{[^}]*transform-origin: 50% 100%;[^}]*animation: spotPopupIn/)
  })
})
