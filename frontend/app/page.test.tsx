import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let fail = false
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/HeroHeader", () => ({ default: () => null }))
vi.mock("@/components/spots/SearchBar", () => ({ default: () => null }))
vi.mock("@/components/spots/SpotSection", () => ({
  default: ({ title, loading }: { title: string; loading: boolean }) => <p>{loading ? `cargando ${title}` : title}</p>,
}))
vi.mock("@/lib/api", () => ({
  api: {
    get: () => fail ? Promise.reject(new Error("Sin conexión")) : Promise.resolve({ data: [], totalCount: 0 }),
  },
}))

const { default: Home } = await import("./page")

afterEach(() => { fail = false })

const flush = () => act(() => Promise.resolve())

describe("Home", () => {
  it("si fallan los lugares, avisa; al reintentar muestra la carga y después las secciones", async () => {
    fail = true
    render(<Home />)
    await flush()
    expect(screen.getByText("Sin conexión")).toBeTruthy()

    fail = false
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(screen.queryByText("Sin conexión")).toBeNull()
    expect(screen.getAllByText(/^cargando /).length).toBeGreaterThan(0)
    await flush()
    expect(screen.queryAllByText(/^cargando /)).toHaveLength(0)
  })
})
