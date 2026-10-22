import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import ExtraCategories from "./ExtraCategories"

const cats = [{ name: "Surf" }, { name: "Kayak" }]
const withMouse = (hover: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: hover && q === "(hover: hover)" }))

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe("el +n de las actividades que no entran", () => {
  it("tiene el hover de las otras pills", () => {
    render(<ExtraCategories categories={cats} emoji={{ Surf: "🏄" }} />)
    expect(screen.getByText("+2").classList.contains("pill-hover")).toBe(true)
  })

  it("con mouse se ven al pasar por encima", () => {
    withMouse(true)
    render(<ExtraCategories categories={cats} emoji={{ Surf: "🏄" }} />)
    fireEvent.mouseEnter(screen.getByText("+2"))
    expect(screen.getByText("🏄 Surf")).toBeTruthy()
    expect(screen.getByText("Kayak")).toBeTruthy()
  })

  it("en pantalla táctil, con un toque", () => {
    withMouse(false)
    render(<ExtraCategories categories={cats} emoji={{}} />)
    fireEvent.click(screen.getByText("+2"))
    expect(screen.getByText("Surf")).toBeTruthy()
  })
})
