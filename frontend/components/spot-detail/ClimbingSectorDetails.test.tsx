import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next/navigation", () => ({ useParams: () => ({}), useRouter: () => ({ push: () => {}, back: () => {} }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => Promise.resolve({
      data: url.endsWith("/routes") ? [] : { id: 5, spot_id: 12, name: "Sector Norte", slug: "sector-norte", routes_count: 0 },
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
})
