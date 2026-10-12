import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let apiCalls = 0
vi.mock("@/components/layout/Footer", () => ({ default: () => <footer>footer</footer> }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => <nav>navbar</nav> }))
vi.mock("@/components/spots/SearchBar", () => ({ default: () => <input aria-label="buscar" /> }))
vi.mock("@/lib/api", () => ({ api: { get: () => { apiCalls++; return Promise.reject(new Error("caído")) } } }))

const { default: NotFound, metadata } = await import("./not-found")

describe("404", () => {
  it("en español, con navbar, footer, buscador y salidas al inicio y a la búsqueda", () => {
    render(<NotFound />)
    expect(screen.getByRole("heading", { name: "No encontramos esta página" })).toBeTruthy()
    expect(screen.getByText("navbar")).toBeTruthy()
    expect(screen.getByText("footer")).toBeTruthy()
    expect(screen.getByLabelText("buscar")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ir al inicio" }).getAttribute("href")).toBe("/")
    expect(screen.getByRole("link", { name: "Ver todos los lugares" }).getAttribute("href")).toBe("/search")
  })

  it("no pide nada a la API (se ve aunque el backend esté caído) y Google no la indexa", () => {
    render(<NotFound />)
    expect(apiCalls).toBe(0)
    expect(metadata.robots).toEqual({ index: false })
  })
})
