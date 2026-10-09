import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import ContributionsList from "./ContributionsList"
import type { AdminContribution } from "@/lib/contributions"

// El mapa (Leaflet) no corre en jsdom: alcanza con saber cuántos puntos recibe.
vi.mock("next/dynamic", () => ({ default: () => ({ points }: { points: unknown[] }) => <div data-testid="track-map">{points.length} puntos</div> }))

const spot = { id: 3, name: "Cerro Arequita", slug: "cerro-arequita", department: "Lavalleja", category: { name: "Escalada" }, owner_email: "duenio@test.com" }

function contribution(overrides: Partial<AdminContribution>): AdminContribution {
  return {
    id: 1, kind: "climbing_sector", item_id: 9, spot_id: 3, status: "pending", title: "Sector Norte",
    reject_reason: null, created_at: "2026-10-01T12:00:00Z", resolved_at: null, spot,
    author_email: "escalador@test.com",
    item: { name: "Sector Norte", type: "deportiva", routes: [{ name: "La Diagonal", grade: "6a" }] },
    ...overrides,
  }
}

function renderList(overrides: Partial<ComponentProps<typeof ContributionsList>> = {}) {
  const props: ComponentProps<typeof ContributionsList> = {
    contributions: [contribution({})], loadError: null, loading: false,
    actionLoading: null, actionErrors: {}, onApprove: vi.fn(), onRejectRequest: vi.fn(),
    ...overrides,
  }
  render(<ContributionsList {...props} />)
  return props
}

describe("ContributionsList", () => {
  it("muestra qué es, dónde, quién y si es el dueño", () => {
    renderList()
    expect(screen.getByText("Sector de escalada")).toBeTruthy()
    expect(screen.getByText(/en Cerro Arequita/)).toBeTruthy()
    expect(screen.getByText("✉️ escalador@test.com")).toBeTruthy()
    expect(screen.getByText("no es el dueño del lugar")).toBeTruthy()
  })

  it("muestra los datos del elemento y las vías del sector", () => {
    renderList()
    expect(screen.getByText("deportiva")).toBeTruthy()
    expect(screen.getByText("Vías del sector (1)")).toBeTruthy()
    expect(screen.getByText("La Diagonal · 6a")).toBeTruthy()
  })

  it("muestra las fotos de una escuela de surf", () => {
    renderList({ contributions: [contribution({
      kind: "surf_school", author_email: "duenio@test.com",
      item: { name: "Escuela Ola", photo_1: "https://res.cloudinary.com/x/image/upload/a.jpg" },
    })] })
    expect(document.querySelectorAll(".photo-grid img")).toHaveLength(1)
    expect(screen.getByText("dueño del lugar")).toBeTruthy()
  })

  it("aprobar y rechazar avisan al padre con el id del aporte", () => {
    const props = renderList()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }))
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }))
    expect(props.onApprove).toHaveBeenCalledWith(1)
    expect(props.onRejectRequest).toHaveBeenCalledWith(1)
  })

  it("muestra el error de esa fila", () => {
    renderList({ actionErrors: { 1: "El elemento de este aporte ya no existe." } })
    expect(screen.getByText("El elemento de este aporte ya no existe.")).toBeTruthy()
  })

  it("sin aportes", () => {
    renderList({ contributions: [] })
    expect(screen.getByText("No hay aportes pendientes.")).toBeTruthy()
  })
})

describe("ContributionsList: recorrido (GPX)", () => {
  it("se revisa viéndolo en el mapa", () => {
    const points = [[-34.3, -55.2, 100], [-34.31, -55.2, 120], [-34.32, -55.2, null]]
    renderList({ contributions: [contribution({
      kind: "track", title: "Recorrido de «Cumbre»",
      item: { target_name: "Cumbre", points_count: 3, distance_km: 2.2, elevation_gain: 20, points },
    })] })
    expect(screen.getByTestId("track-map").textContent).toBe("3 puntos")
    expect(screen.getByText("Recorrido (GPX)")).toBeTruthy()
  })

  it("las demás no muestran mapa", () => {
    renderList()
    expect(screen.queryByTestId("track-map")).toBeNull()
  })
})
