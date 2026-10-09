import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// API simulada con valores comunes, no vi.fn: devuelve la página o un 404.
let page: unknown = null
let requested: string[] = []
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => { requested.push(url); return page ? Promise.resolve({ data: page }) : Promise.reject(new Error("404")) } },
}))

const { default: SectorPage, generateMetadata } = await import("./page")
const params = Promise.resolve({ slug: "arequita", sectorSlug: "norte" })

const sector = {
  id: 5, spot_id: 12, name: "Norte", slug: "norte", type: "Deportiva", restrictions: null, max_altitude: null,
  routes_count: 2, min_grade: "5b", max_grade: "6c", approach_minutes: 90, sun_exposure: "mixto", rock_type: null,
}
const spot = { id: 12, name: "Cerro Arequita", slug: "arequita", department: "Lavalleja" }
const routes = [
  { id: 1, name: "Fisura", grade: "6a", bolts: 8, length: 20, description: null },
  { id: 2, name: "Techo", grade: "6c", bolts: null, length: null, description: "Sale por el techo." },
]

afterEach(() => { page = null; requested = [] })

describe("metadata del sector", () => {
  it("cuenta las vías con routes_count", async () => {
    page = { sector: { ...sector, routes_count: 8 }, spot, routes }
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("Norte | Rumbo")
    expect(meta.description).toBe("Sector de escalada: 8 vías, graduación 5b–6c.")
  })

  it("si no existe, usa el slug y una descripción genérica", async () => {
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("norte | Rumbo")
    expect(meta.description).toBe("Sector de escalada en Uruguay.")
  })
})

describe("página del sector", () => {
  it("se busca dentro de su lugar y muestra sus vías", async () => {
    page = { sector, spot, routes }
    render(await SectorPage({ params }))
    expect(requested.at(-1)).toBe("/sectors/page/arequita/norte")
    expect(screen.getByText("Fisura")).toBeTruthy()
    expect(screen.getByText("Vías — 2")).toBeTruthy()
  })

  it("cualquiera puede sugerir una vía", async () => {
    page = { sector, spot, routes }
    render(await SectorPage({ params }))
    expect(screen.getByRole("link", { name: "＋ Sugerir una vía" }).getAttribute("href")).toBe("/agregar-lugar?sumar=via&spot=12&sector=5")
  })

  it("solo los datos que se saben", async () => {
    page = { sector, spot, routes }
    render(await SectorPage({ params }))
    expect(screen.getByText("1 h 30 min")).toBeTruthy()
    expect(screen.getByText("Sol y sombra")).toBeTruthy()
    expect(screen.queryByText("Roca")).toBeNull()
    expect(screen.queryByText("Altitud")).toBeNull()
  })

  it("las restricciones van como aviso; sin características no dice nada", async () => {
    page = { sector: { ...sector, type: null, restrictions: "Cerrado de agosto a noviembre." }, spot, routes }
    render(await SectorPage({ params }))
    expect(screen.getByRole("note").textContent).toBe("⚠️ Restricciones: Cerrado de agosto a noviembre.")
    expect(screen.queryByText("Sin características registradas.")).toBeNull()
  })

  it("sin vías, lo dice", async () => {
    page = { sector: { ...sector, routes_count: 0 }, spot, routes: [] }
    render(await SectorPage({ params }))
    expect(screen.getByText("Todavía no hay vías cargadas en este sector.")).toBeTruthy()
  })

  it("si no existe, 404", async () => {
    await expect(SectorPage({ params })).rejects.toThrow("404")
  })
})
