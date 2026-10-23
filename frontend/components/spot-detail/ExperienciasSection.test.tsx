import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ExperienciasSection, { type Experience } from "./ExperienciasSection"

const exp = (id: number, title: string, extra: Partial<Experience> = {}): Experience => ({
  id, title, description: null, price: null, currency: "UYU", schedule: null, contact: null,
  category: { id: 1, name: "Trekking" }, is_active: true, ...extra,
})

afterEach(() => vi.unstubAllGlobals())

describe("experiencias del lugar", () => {
  it("muestra las que vienen con el lugar, sin pedirlas de nuevo al backend", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    render(<ExperienciasSection experiences={[exp(1, "Subida al cerro"), exp(2, "Pausada", { is_active: false })]} />)
    expect(screen.getByText("Subida al cerro")).toBeTruthy()
    expect(screen.queryByText("Pausada")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("sin experiencias activas no muestra nada", () => {
    const { container } = render(<ExperienciasSection experiences={[exp(2, "Pausada", { is_active: false })]} />)
    expect(container.innerHTML).toBe("")
    expect(render(<ExperienciasSection />).container.innerHTML).toBe("")
  })

  it("respeta los saltos de línea de la descripción", () => {
    const text = "Distancia: 2 km\nDificultad: Media"
    render(<ExperienciasSection experiences={[exp(1, "Sendero", { description: text })]} />)
    const p = screen.getByText(/Distancia: 2 km/)
    expect(p.textContent).toBe(text)
    expect(p.style.whiteSpace).toBe("pre-line")
  })
})
