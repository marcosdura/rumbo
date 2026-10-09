import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let school: Record<string, unknown> = {}
let summary = { average: null as number | null, total: 0 }
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/ReviewsSection", () => ({ default: () => null }))
vi.mock("@/components/seo/JsonLd", () => ({ default: () => null }))
vi.mock("@/components/operator-page/BackButton", () => ({ default: () => null }))
vi.mock("@/components/operator-page/OperatorPhotos", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => Promise.resolve({ data: url.endsWith("/summary") ? summary : school }) },
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

const page = async () => render(await SurfSchoolPage({ params: Promise.resolve({ slug: "escuela-ola-4" }) }))

describe("Página de la escuela: encabezado y panel", () => {
  it("muestra el puntaje arriba, con link a las reseñas", async () => {
    school = { ...base }
    summary = { average: 4.6, total: 12 }
    const { container } = await page()
    expect(screen.getByText("4.6")).toBeTruthy()
    expect(screen.getByText("12 reseñas").closest("a")!.getAttribute("href")).toBe("#reviews")
    expect(container.querySelector("#reviews")).toBeTruthy()
    summary = { average: null, total: 0 }
  })

  it("sin reseñas invita a dejar la primera", async () => {
    school = { ...base }
    await page()
    expect(screen.getByText("¡Sé el primero en reseñar!")).toBeTruthy()
  })

  it("la temporada aparece una vez, y sin cargar no dice Todo el año", async () => {
    school = { ...base, season_start: 12, season_end: 3 }
    await page()
    expect(screen.getAllByText("Diciembre – Marzo")).toHaveLength(1)
  })

  it("sin temporada no inventa una", async () => {
    school = { ...base }
    await page()
    expect(screen.queryByText("Todo el año")).toBeNull()
    expect(screen.queryByText("Temporada")).toBeNull()
  })

  it("fuera de temporada, lo avisa arriba", async () => {
    const next = (new Date().getMonth() + 1) % 12 + 1
    school = { ...base, season_start: next, season_end: next }
    await page()
    expect(screen.getByText(/⚠️ Fuera de temporada · abre en/)).toBeTruthy()
  })

  it("sin fotos, el panel ocupa el ancho (no queda una columna vacía)", async () => {
    school = { ...base }
    const { container } = await page()
    expect(container.querySelector(".op-grid")!.className).toContain("is-panel-only")
    school = { ...base, photo_1: "https://res.cloudinary.com/x/image/upload/v1/rumbo/3/abc.jpg" }
    const again = await page()
    expect(again.container.querySelector(".op-grid")!.className).not.toContain("is-panel-only")
  })
})
