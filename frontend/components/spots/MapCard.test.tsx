import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Leaflet necesita un DOM real con medidas; para el test alcanza con cajas.
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("leaflet", () => ({ default: { icon: () => ({}) } }))
vi.mock("leaflet/dist/leaflet.css", () => ({}))

const { default: MapCard } = await import("./MapCard")

describe("MapCard", () => {
  it("sin coordenadas no muestra nada", () => {
    const { container } = render(<MapCard lat={null} lng={null} name="Cascada" />)
    expect(container.innerHTML).toBe("")
  })

  it("si las coordenadas llegan después, muestra el mapa sin romper", () => {
    const { rerender } = render(<MapCard lat={null} lng={null} name="Cascada" />)
    rerender(<MapCard lat={-34.6} lng={-58.4} name="Cascada" />)
    expect(screen.getByTestId("map")).toBeTruthy()
  })

  it("si las coordenadas se van (otro lugar sin ubicación), no rompe", () => {
    const { container, rerender } = render(<MapCard lat={-34.6} lng={-58.4} name="Cascada" />)
    rerender(<MapCard lat={null} lng={null} name="Otro" />)
    expect(container.innerHTML).toBe("")
  })
})
