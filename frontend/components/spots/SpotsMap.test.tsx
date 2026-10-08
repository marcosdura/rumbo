import { describe, expect, it, vi } from "vitest"

// Leaflet necesita un DOM real; acá solo se prueba el HTML del popup.
vi.mock("react-leaflet", () => ({ MapContainer: () => null, TileLayer: () => null, useMap: () => ({}) }))
vi.mock("leaflet", () => ({ default: { divIcon: () => ({}), latLngBounds: () => ({}) } }))
vi.mock("leaflet.markercluster", () => ({}))
vi.mock("leaflet/dist/leaflet.css", () => ({}))
vi.mock("leaflet.markercluster/dist/MarkerCluster.css", () => ({}))
vi.mock("leaflet.markercluster/dist/MarkerCluster.Default.css", () => ({}))

const { createPopupHtml } = await import("./SpotsMap")

describe("popup del mapa", () => {
  it("abre el lugar en la misma pestaña y escapa el nombre", () => {
    const html = createPopupHtml({ slug: "cascada", name: "<b>Cascada</b>", department: "Rocha" }, [{ name: "Camping" }])
    expect(html).toContain('href="/spots/cascada"')
    expect(html).not.toContain("_blank")
    expect(html).toContain("&lt;b&gt;Cascada&lt;/b&gt;")
  })
})
