import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

type Spot = { id: number; name: string; slug: string }
const counts = [
  { activity: "Camping", department: "Rocha", count: 2 },
  { activity: "Camping", department: "Lavalleja", count: 1 },
  { activity: "Trekking", department: "Rocha", count: 1 },
]
let spots: Spot[] = []
let total: number | null = null
let fail = false
const calls: { url: string; params?: Record<string, unknown> }[] = []

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/spots/SpotCard", () => ({ default: ({ spot }: { spot: Spot }) => <a href={`/spots/${spot.slug}`}>{spot.name}</a> }))
vi.mock("@/components/seo/JsonLd", () => ({ default: ({ data }: { data: unknown }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} /> }))
vi.mock("@/lib/api", () => ({
  api: {
    get: async (url: string, opts?: { params?: Record<string, unknown> }) => {
      calls.push({ url, params: opts?.params })
      if (fail) throw new Error("caído")
      if (url === "/sitemap/places") return { data: counts, totalCount: null }
      return { data: spots, totalCount: total ?? spots.length }
    },
  },
}))

const { default: OnePage, generateMetadata } = await import("./[slug]/page")
const { default: ComboPage } = await import("./[slug]/[departamento]/page")

const one = (slug: string) => OnePage({ params: Promise.resolve({ slug }) })
const combo = (slug: string, departamento: string) => ComboPage({ params: Promise.resolve({ slug, departamento }) })
const hrefOf = (name: string | RegExp) => screen.getByRole("link", { name }).getAttribute("href")

afterEach(() => {
  spots = []; total = null; fail = false; calls.length = 0
})

describe("/lugares/[actividad]", () => {
  it("Camping en Uruguay: los lugares, los departamentos con camping y el buscador", async () => {
    spots = [{ id: 1, name: "Laguna Negra", slug: "laguna-negra" }, { id: 2, name: "Santa Teresa", slug: "santa-teresa" }]
    render(await one("camping"))
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Camping en Uruguay")
    expect(hrefOf("Laguna Negra")).toBe("/spots/laguna-negra")
    expect(screen.getByText("2 lugares")).toBeTruthy()
    expect(hrefOf(/^Rocha/)).toBe("/lugares/camping/rocha")
    expect(hrefOf(/^Lavalleja/)).toBe("/lugares/camping/lavalleja")
    expect(hrefOf("Filtrar y ver en el mapa →")).toBe("/search?activity=Camping")
    expect(calls.find(c => c.url === "/spots")?.params).toMatchObject({ activity: "Camping", department: undefined, limit: 100 })
  })

  it("si hay más de los que entran, manda al buscador con el total", async () => {
    spots = [{ id: 1, name: "Uno", slug: "uno" }]
    total = 140
    render(await one("camping"))
    expect(hrefOf("Ver los 140 en el buscador →")).toBe("/search?activity=Camping")
  })

  it("una actividad sin lugares igual tiene su página, e invita a sumar uno", async () => {
    render(await one("surf"))
    expect(screen.getByText("Todavía no hay lugares")).toBeTruthy()
    expect(hrefOf("＋ Sumá un lugar")).toBe("/agregar-lugar")
  })

  it("título y descripción propios", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "trekking" }) })
    expect(m.title).toBe("Trekking en Uruguay | Rumbo")
    expect(m.alternates?.canonical).toBe("/lugares/trekking")
  })
})

describe("/lugares/[departamento]", () => {
  it("Lugares en Rocha: qué hacer ahí, con cuántos lugares", async () => {
    spots = [{ id: 1, name: "Laguna Negra", slug: "laguna-negra" }]
    render(await one("rocha"))
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Lugares en Rocha")
    expect(hrefOf(/Camping/)).toBe("/lugares/camping/rocha")
    expect(hrefOf(/Trekking/)).toBe("/lugares/trekking/rocha")
    expect(calls.find(c => c.url === "/spots")?.params).toMatchObject({ activity: undefined, department: "Rocha" })
  })

  it("un departamento sin lugares, o algo que no existe, da 404", async () => {
    await expect(one("artigas")).rejects.toThrow("404")
    await expect(one("cualquiera")).rejects.toThrow("404")
  })
})

describe("/lugares/[actividad]/[departamento]", () => {
  it("Camping en Rocha: vuelve a Camping en Uruguay y ofrece otros departamentos y actividades", async () => {
    spots = [{ id: 1, name: "Laguna Negra", slug: "laguna-negra" }]
    render(await combo("camping", "rocha"))
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Camping en Rocha")
    expect(hrefOf("← Camping en Uruguay")).toBe("/lugares/camping")
    expect(hrefOf(/^Lavalleja/)).toBe("/lugares/camping/lavalleja")
    expect(screen.queryByRole("link", { name: /^Rocha/ })).toBeNull()
    expect(hrefOf(/Trekking/)).toBe("/lugares/trekking/rocha")
    expect(calls.find(c => c.url === "/spots")?.params).toMatchObject({ activity: "Camping", department: "Rocha" })
    const ld = document.querySelector('script[type="application/ld+json"]')!.textContent!
    expect(ld).toContain("https://rumboapp.uy/spots/laguna-negra")
  })

  it("sin lugares, o con una actividad o un departamento que no existen, da 404", async () => {
    await expect(combo("camping", "artigas")).rejects.toThrow("404")
    await expect(combo("rocha", "camping")).rejects.toThrow("404")
    await expect(combo("camping", "narnia")).rejects.toThrow("404")
  })

  it("si falla la API, el error sigue (no es un 404)", async () => {
    fail = true
    await expect(combo("camping", "rocha")).rejects.toThrow("caído")
  })
})
