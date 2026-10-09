import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// API simulada con valores comunes, no vi.fn: devuelve la página o un 404.
let page: unknown = null
let requested: string[] = []
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => { requested.push(url); return page ? Promise.resolve({ data: page }) : Promise.reject(new Error("404")) } },
}))

const { default: TrekkingRoutePage, generateMetadata } = await import("./page")
const params = Promise.resolve({ slug: "arequita", routeSlug: "cumbre" })

const route = {
  id: 1, name: "Cumbre", slug: "cumbre", distance_km: 4, duration_hours: 1.5, difficulty: "moderado",
  elevation_gain: null, elevation_loss: null, max_altitude: 300, min_altitude: null,
  route_type: "circular", technical_level: null, physical_demand: null, description: null,
}
const spot = { id: 7, name: "Cerro Arequita", slug: "arequita", department: "Lavalleja", trekking_detail: { bathrooms: true } }

afterEach(() => { page = null; requested = [] })

describe("metadata de la ruta", () => {
  it("con los datos de la ruta", async () => {
    page = { route, spot }
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("Cumbre | Rumbo")
    expect(meta.description).toBe("Ruta de trekking: 4 km, 1.5 h, dificultad moderado.")
  })

  it("con descripción, la usa", async () => {
    page = { route: { ...route, description: "Sube por el bosque hasta la cruz." }, spot }
    expect((await generateMetadata({ params })).description).toBe("Sube por el bosque hasta la cruz.")
  })

  it("si no existe, sin undefined en la descripción", async () => {
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("cumbre | Rumbo")
    expect(meta.description).toBe("Ruta de trekking en Uruguay.")
  })
})

describe("página de la ruta", () => {
  it("se busca dentro de su lugar", async () => {
    page = { route, spot }
    render(await TrekkingRoutePage({ params }))
    expect(requested.at(-1)).toBe("/routes/page/arequita/cumbre")
  })

  it("solo los datos que se saben, con coma decimal", async () => {
    page = { route, spot }
    render(await TrekkingRoutePage({ params }))
    expect(screen.getByText("1,5 h")).toBeTruthy()
    expect(screen.getByText("300 m")).toBeTruthy()
    expect(screen.queryByText("Desnivel +")).toBeNull()
    expect(screen.queryByText("—")).toBeNull()
  })

  it("muestra la descripción con sus párrafos", async () => {
    page = { route: { ...route, description: "Sube por el bosque.\n\nOjo con la bajada." }, spot }
    render(await TrekkingRoutePage({ params }))
    expect(screen.getByText(/Sube por el bosque/).textContent).toBe("Sube por el bosque.\n\nOjo con la bajada.")
  })

  it("vuelve al lugar y Compartir abre el modal", async () => {
    page = { route, spot }
    render(await TrekkingRoutePage({ params }))
    expect(screen.getByRole("link", { name: "← Cerro Arequita" }).getAttribute("href")).toBe("/spots/arequita")
    fireEvent.click(screen.getByRole("button", { name: "🔗 Compartir" }))
    expect(screen.getByText("Copiar link")).toBeTruthy()
  })

  it("si no existe, 404 (antes quedaba cargando para siempre)", async () => {
    await expect(TrekkingRoutePage({ params })).rejects.toThrow("404")
  })
})
