import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next/navigation", () => ({ useParams: () => ({}), useRouter: () => ({ push: () => {}, back: () => {} }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
let extra: Record<string, unknown> = {}
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => Promise.resolve({
      data: url.endsWith("/routes") ? [] : { id: 5, spot_id: 12, name: "Sector Norte", slug: "sector-norte", routes_count: 0, ...extra },
    }),
  },
}))

const { default: ClimbingSectorDetails } = await import("./ClimbingSectorDetails")

describe("ClimbingSectorDetails", () => {
  it("cualquiera puede sugerir una vía en el sector", async () => {
    render(<ClimbingSectorDetails slug="sector-norte" />)
    const link = await screen.findByRole("link", { name: "＋ Sugerir una vía" })
    expect(link.getAttribute("href")).toBe("/agregar-lugar?sumar=via&spot=12&sector=5")
  })

  it("sin slug ni id muestra que no existe", () => {
    render(<ClimbingSectorDetails />)
    expect(screen.getByText("Sector no encontrado")).toBeTruthy()
  })

  it("muestra aproximación, sol o sombra y roca; lo que no se sabe, con un guion", async () => {
    extra = { approach_minutes: 90, sun_exposure: "mixto", rock_type: null }
    render(<ClimbingSectorDetails slug="sector-norte" />)
    expect(await screen.findByText("1 h 30 min")).toBeTruthy()
    expect(screen.getByText("Sol y sombra")).toBeTruthy()
    const roca = screen.getByText("Roca").parentElement!
    expect(roca.textContent).toContain("—")
    extra = {}
  })
})
