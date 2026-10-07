import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let school: Record<string, unknown> = {}
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/ReviewsSection", () => ({ default: () => null }))
vi.mock("@/components/seo/JsonLd", () => ({ default: () => null }))
vi.mock("./BackButton", () => ({ default: () => null }))
vi.mock("./SurfPhotos", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => Promise.resolve({ data: url.endsWith("/summary") ? { average: null, total: 0 } : school }) },
}))

const { default: SurfSchoolPage } = await import("./page")

const base = {
  id: 4, name: "Escuela Ola", duration: null, email: null, whatsapp: null, instagram: null,
  season_start: null, season_end: null, photo_1: null, photo_2: null, photo_3: null,
  spot_id: 3, spot_name: "Playa Brava", spot_department: "Rocha", class_type: null, equipment_include: null,
}

describe("Página de la escuela de surf", () => {
  it("muestra niveles e idiomas cuando se saben", async () => {
    school = { ...base, levels: ["principiante", "intermedio"], languages: ["espanol", "ingles"] }
    render(await SurfSchoolPage({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))
    expect(screen.getByText("Principiante, Intermedio")).toBeTruthy()
    expect(screen.getByText("Español, Inglés")).toBeTruthy()
  })

  it("si no se saben, no muestra esas filas", async () => {
    school = { ...base, levels: null, languages: null }
    render(await SurfSchoolPage({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))
    expect(screen.queryByText("Niveles")).toBeNull()
    expect(screen.queryByText("Idiomas")).toBeNull()
  })
})
