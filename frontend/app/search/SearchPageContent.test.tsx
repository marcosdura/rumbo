import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// URL y API simuladas con valores comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let params = new URLSearchParams("activity=Trekking")
let listRequests: string[] = []
let failList = false
let emptyResults = false
vi.mock("next/navigation", () => ({ useSearchParams: () => params }))
vi.mock("next/dynamic", () => ({ default: () => () => null }))
vi.mock("../../components/layout/Navbar", () => ({ default: () => null }))
vi.mock("../../components/spots/SpotCard", () => ({ default: ({ spot }: { spot: { name: string } }) => <div>{spot.name}</div> }))
vi.mock("../../lib/analytics", () => ({ trackEvent: () => {} }))
// El drawer de trekking se reemplaza por un botón que aplica un filtro.
vi.mock("../../components/spots/TrekkingFilters", () => ({
  default: ({ onApply }: { onApply: (f: unknown) => void }) => (
    <button onClick={() => onApply({ difficulties: ["Difícil"], durations: [], distances: [], amenities: {} })}>filtrar difícil</button>
  ),
}))
vi.mock("../../components/spots/CampingFilters", () => ({
  default: ({ onApply }: { onApply: (f: unknown) => void }) => (
    <button onClick={() => onApply({ amenityIds: [], priceRanges: [], petFriendly: true })}>filtrar mascotas</button>
  ),
}))
vi.mock("../../lib/api", () => ({
  api: {
    get: (url: string) => {
      if (url.startsWith("/spots/pins")) return Promise.resolve({ data: [] })
      listRequests.push(url)
      if (failList) return Promise.reject(new Error("Falló la búsqueda"))
      if (emptyResults) return Promise.resolve({ data: [], totalCount: 0 })
      return Promise.resolve({ data: [{ id: 1, name: "Cerro Arequita" }], totalCount: 1 })
    },
  },
}))

const { default: SearchPage } = await import("./SearchPageContent")

afterEach(() => {
  params = new URLSearchParams("activity=Trekking")
  listRequests = []
  failList = false
  emptyResults = false
})

const flush = () => act(() => Promise.resolve())

describe("SearchPageContent", () => {
  it("cambiar de actividad limpia los filtros y busca una sola vez", async () => {
    const { rerender } = render(<SearchPage />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "filtrar difícil" }))
    await flush()
    expect(listRequests.at(-1)).toContain("difficulty=Dif")

    listRequests = []
    params = new URLSearchParams("activity=Kayak")
    rerender(<SearchPage />)
    await flush()
    expect(listRequests).toHaveLength(1)

    listRequests = []
    params = new URLSearchParams("activity=Trekking")
    rerender(<SearchPage />)
    await flush()
    expect(listRequests).toHaveLength(1)
    expect(listRequests[0]).not.toContain("difficulty")
  })

  it("al reintentar vuelve a mostrar la carga en vez del error", async () => {
    failList = true
    render(<SearchPage />)
    await flush()
    expect(screen.getByText("Falló la búsqueda")).toBeTruthy()
    failList = false
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(screen.queryByText("Falló la búsqueda")).toBeNull()
    await flush()
    expect(screen.getByText("Cerro Arequita")).toBeTruthy()
  })

  it("camping: el filtro de mascotas va como pet_friendly", async () => {
    params = new URLSearchParams("activity=Camping")
    render(<SearchPage />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "filtrar mascotas" }))
    await flush()
    expect(listRequests.at(-1)).toContain("pet_friendly=true")
  })

  it("sin resultados y con filtros: ofrece quitarlos", async () => {
    render(<SearchPage />)
    await flush()
    emptyResults = true
    fireEvent.click(screen.getByRole("button", { name: "filtrar difícil" }))
    await flush()
    expect(screen.getByText("No hay lugares con estos filtros")).toBeTruthy()
    emptyResults = false
    fireEvent.click(screen.getByRole("button", { name: "Quitar filtros" }))
    await flush()
    expect(listRequests.at(-1)).not.toContain("difficulty")
  })

  it("sin resultados y sin filtros: invita a sumar un lugar; el título dice lugares", async () => {
    params = new URLSearchParams("department=Flores")
    emptyResults = true
    render(<SearchPage />)
    await flush()
    expect(screen.getByRole("heading", { name: "Lugares en Flores" })).toBeTruthy()
    expect(screen.getByText("Todavía no hay lugares acá")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Sumalo" }).getAttribute("href")).toBe("/agregar-lugar")
  })
})
