import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { HomeData } from "@/lib/home"

// La home se arma en el servidor con GET /home: el backend ya eligió las
// secciones; acá se prueba cómo se muestran.
let home: HomeData | null = null
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/HeroHeader", () => ({ default: () => null }))
vi.mock("@/components/spots/SearchBar", () => ({ default: () => null }))
vi.mock("@/components/spots/SpotSection", () => ({
  default: ({ title, spots }: { title: string; spots: unknown[] }) => <h2 data-spots={spots.length}>{title}</h2>,
}))
vi.mock("@/lib/api", () => ({
  api: { get: () => (home ? Promise.resolve({ data: home }) : Promise.reject(new Error("caído"))) },
}))

const { default: Home } = await import("./page")

const spot = (id: number) => ({ id, name: `Lugar ${id}` })
const section = (key: string, title: string) => ({ key, label: "", title, href: "/search", total: 0, spots: [spot(1), spot(2), spot(3)] })

afterEach(() => { home = null })

describe("Home", () => {
  it("populares arriba, después recién agregados, la invitación y las colecciones del día", async () => {
    home = {
      stats: { spots: 42, departments: 7 },
      sections: [section("popular", "Populares"), section("recent", "Recién agregados"), section("department:Rocha", "Lugares en Rocha")],
    }
    const { container } = render(await Home())
    const order = Array.from(container.querySelectorAll("h2, p")).map(e => e.textContent)
      .filter(t => ["Populares", "Recién agregados", "¿Conocés un lugar que no está?", "Lugares en Rocha"].includes(t ?? ""))
    expect(order).toEqual(["Populares", "Recién agregados", "¿Conocés un lugar que no está?", "Lugares en Rocha"])
    expect(screen.getByRole("link", { name: "＋ Agregar lugar" }).getAttribute("href")).toBe("/agregar-lugar")
  })

  it("el hero muestra cuántos lugares y departamentos hay", async () => {
    home = { stats: { spots: 42, departments: 7 }, sections: [] }
    render(await Home())
    expect(screen.getByText("42 lugares para descubrir en 7 departamentos")).toBeTruthy()
  })

  it("sin lugares todavía, igual invita a sumar uno", async () => {
    home = { stats: { spots: 0, departments: 0 }, sections: [] }
    render(await Home())
    expect(screen.getByText("¿Conocés un lugar que no está?")).toBeTruthy()
  })

  it("si el backend no responde, ofrece reintentar", async () => {
    render(await Home())
    expect(screen.getByText("No pudimos cargar los lugares.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy()
  })
})
