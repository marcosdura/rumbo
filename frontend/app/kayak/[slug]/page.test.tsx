import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let kayak: Record<string, unknown> = {}
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/ReviewsSection", () => ({ default: () => null }))
vi.mock("@/components/seo/JsonLd", () => ({ default: () => null }))
vi.mock("./BackButton", () => ({ default: () => null }))
vi.mock("./KayakPhotos", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => Promise.resolve({ data: url.endsWith("/summary") ? { average: null, total: 0 } : kayak }) },
}))

const { default: KayakDetailPage } = await import("./page")

const base = {
  id: 4, name: "Kayak Sur", duration: null, email: null, whatsapp: null, instagram: null,
  season_start: null, season_end: null, photo_1: null, photo_2: null, photo_3: null,
  spot_id: 3, spot_name: "Laguna", spot_department: "Rocha",
  water_type: null, difficulty: null, kayak_type: null, rental_available: null,
}

describe("Página del servicio de kayak", () => {
  it("muestra guía y chaleco cuando se saben", async () => {
    kayak = { ...base, includes_guide: true, includes_life_jacket: false }
    render(await KayakDetailPage({ params: Promise.resolve({ slug: "kayak-sur-4" }) }))
    expect(screen.getByText("🧭 Guía").nextElementSibling!.textContent).toBe("Sí")
    expect(screen.getByText("🦺 Chaleco salvavidas").nextElementSibling!.textContent).toBe("No")
  })

  it("si no se saben, no los muestra", async () => {
    kayak = { ...base, includes_guide: null, includes_life_jacket: null }
    render(await KayakDetailPage({ params: Promise.resolve({ slug: "kayak-sur-4" }) }))
    expect(screen.queryByText("🧭 Guía")).toBeNull()
  })
})
