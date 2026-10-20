import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// URL, router y API simulados con valores comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts). Los filtros viven en la URL:
// cada cambio es un router.replace a una URL nueva.
let params = new URLSearchParams("activity=Trekking")
let replaced: string[] = []
let listRequests: string[] = []
let failList = false
let emptyResults = false
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ replace: (url: string) => replaced.push(url) }),
}))
vi.mock("next/dynamic", () => ({ default: () => () => null }))
vi.mock("../../components/layout/Navbar", () => ({ default: () => null }))
vi.mock("../../components/spots/SpotCard", () => ({ default: ({ spot }: { spot: { name: string } }) => <div>{spot.name}</div> }))
vi.mock("../../lib/analytics", () => ({ trackEvent: () => {} }))
// El panel de trekking se reemplaza por un botón que aplica un filtro.
vi.mock("../../components/spots/TrekkingFilters", () => ({
  default: ({ onApply }: { onApply: (f: unknown) => void }) => (
    <button onClick={() => onApply({ difficulties: ["difícil"], durations: [], distances: [], amenities: {} })}>filtrar difícil</button>
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
  replaced = []
  listRequests = []
  failList = false
  emptyResults = false
})

const flush = () => act(() => Promise.resolve())
const lastReplace = () => new URLSearchParams(replaced.at(-1)!.split("?")[1] ?? "")

describe("Búsqueda: los filtros viven en la URL", () => {
  it("los filtros de la URL se mandan al backend y se ven como chips", async () => {
    params = new URLSearchParams("activity=Trekking&difficulty=fácil&pet_friendly=true")
    render(<SearchPage />)
    await flush()
    expect(listRequests[0]).toContain("difficulty=f%C3%A1cil")
    expect(listRequests[0]).toContain("pet_friendly=true")
    expect(screen.getByRole("button", { name: "Quitar Fácil" })).toBeTruthy()
    // Mascotas se ve como botón prendido, no como chip.
    expect(screen.getByRole("button", { name: "🐶 Acepta mascotas" }).getAttribute("aria-pressed")).toBe("true")
  })

  it("aplicar el panel cambia la URL (con lo demás que había)", async () => {
    params = new URLSearchParams("activity=Trekking&department=Lavalleja&cell_signal=true")
    render(<SearchPage />)
    fireEvent.click(screen.getByRole("button", { name: "filtrar difícil" }))
    const url = lastReplace()
    expect(url.getAll("difficulty")).toEqual(["difícil"])
    expect(url.get("department")).toBe("Lavalleja")
    expect(url.get("cell_signal")).toBe("true")
  })

  it("quitar un chip lo saca de la URL", async () => {
    params = new URLSearchParams("activity=Trekking&difficulty=fácil&difficulty=difícil")
    render(<SearchPage />)
    fireEvent.click(screen.getByRole("button", { name: "Quitar Fácil" }))
    expect(lastReplace().getAll("difficulty")).toEqual(["difícil"])
  })

  it("quitar la actividad saca sus filtros pero deja departamento y los prácticos", async () => {
    params = new URLSearchParams("activity=Trekking&department=Rocha&difficulty=fácil&pet_friendly=true")
    render(<SearchPage />)
    fireEvent.click(screen.getByRole("button", { name: "Quitar Trekking" }))
    expect(lastReplace().toString()).toBe("department=Rocha&pet_friendly=true")
  })

  it("los filtros rápidos están siempre, aun sin actividad", async () => {
    params = new URLSearchParams("department=Rocha")
    render(<SearchPage />)
    fireEvent.click(screen.getByRole("button", { name: "📅 Sin reserva" }))
    expect(lastReplace().get("reservation_required")).toBe("false")
  })

  it("ordenar: por defecto recomendados; elegir otro va a la URL", async () => {
    render(<SearchPage />)
    await flush()
    expect(listRequests[0]).toContain("sort=recommended")
    fireEvent.click(screen.getByRole("combobox", { name: "Ordenar" }))
    fireEvent.mouseDown(screen.getByRole("option", { name: /Nombre/ }))
    expect(lastReplace().get("sort")).toBe("name")
  })

  it("limpiar filtros deja actividad, departamento y orden", async () => {
    params = new URLSearchParams("activity=Trekking&department=Rocha&sort=rating&difficulty=fácil&cell_signal=true")
    render(<SearchPage />)
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }))
    expect(lastReplace().toString()).toBe("activity=Trekking&department=Rocha&sort=rating")
  })
})

describe("Búsqueda: resultados", () => {
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

  it("sin resultados y con filtros: ofrece quitarlos", async () => {
    params = new URLSearchParams("activity=Trekking&difficulty=difícil")
    emptyResults = true
    render(<SearchPage />)
    await flush()
    expect(screen.getByText("No hay lugares con estos filtros")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Quitar filtros" }))
    expect(lastReplace().toString()).toBe("activity=Trekking")
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

describe("Búsqueda: la primera tanda viene del servidor", () => {
  const fromServer = (query: string, total = 30) => ({
    query, total, spots: [{ id: 7, name: "Laguna Negra" }, { id: 8, name: "Santa Teresa" }],
  })

  it("si es de esta misma URL, la muestra de entrada y no la vuelve a pedir", async () => {
    render(<SearchPage initial={fromServer("activity=Trekking")} />)
    expect(screen.getByText("Laguna Negra")).toBeTruthy()
    await flush()
    expect(listRequests).toEqual([])
  })

  it("Cargar más sigue después de lo que trajo el servidor", async () => {
    render(<SearchPage initial={fromServer("activity=Trekking")} />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: /Cargar más/ }))
    await flush()
    expect(listRequests).toHaveLength(1)
    expect(new URLSearchParams(listRequests[0].split("?")[1]).get("offset")).toBe("2")
  })

  it("si es de otra URL (cambiaron los filtros), la pide como siempre", async () => {
    render(<SearchPage initial={fromServer("activity=Camping")} />)
    await flush()
    expect(listRequests).toHaveLength(1)
    expect(screen.getByText("Cerro Arequita")).toBeTruthy()
    expect(screen.queryByText("Laguna Negra")).toBeNull()
  })

  it("al cambiar la URL a la que trajo el servidor, usa esa tanda sin pedirla", async () => {
    params = new URLSearchParams("activity=Camping")
    const { rerender } = render(<SearchPage initial={null} />)
    await flush()
    expect(listRequests).toHaveLength(1)
    params = new URLSearchParams("activity=Trekking")
    rerender(<SearchPage initial={fromServer("activity=Trekking")} />)
    await flush()
    expect(listRequests).toHaveLength(1)
    expect(screen.getByText("Laguna Negra")).toBeTruthy()
  })
})
