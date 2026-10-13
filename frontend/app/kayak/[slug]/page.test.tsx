import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let kayak: Record<string, unknown> = {}
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/components/spot-detail/ReviewsSection", () => ({ default: () => null }))
vi.mock("@/components/seo/JsonLd", () => ({ default: ({ data }: { data: unknown }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} /> }))
vi.mock("@/components/operator-page/BackButton", () => ({ default: () => null }))
vi.mock("@/components/operator-page/OperatorPhotos", () => ({ default: () => null }))
let fail: number | null = null
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async (url: string) => {
      const { ApiError } = await import("@/lib/api")
      if (fail && !url.endsWith("/summary")) throw new ApiError(fail, fail === 404 ? "No encontrado" : "caído")
      return Promise.resolve({ data: url.endsWith("/summary") ? { average: null, total: 0 } : kayak })
    },
  },
}))

const { default: KayakDetailPage } = await import("./page")

const base = {
  id: 4, name: "Kayak Sur", duration: null, email: null, whatsapp: null, instagram: null,
  season_start: null, season_end: null, photo_1: null, photo_2: null, photo_3: null,
  spot_id: 3, spot_name: "Laguna", spot_department: "Rocha",
  water_type: null, difficulty: null, kayak_type: null, rental_available: null,
  description: null, price_from: null, price_note: null,
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

describe("Página del servicio de kayak: descripción y precio", () => {
  it("muestra Sobre el servicio y el precio desde", async () => {
    kayak = { ...base, description: "Salidas al atardecer.", price_from: 900, price_note: "por hora" }
    render(await KayakDetailPage({ params: Promise.resolve({ slug: "kayak-sur-4" }) }))
    expect(screen.getByText("Sobre el servicio")).toBeTruthy()
    expect(screen.getByText("Salidas al atardecer.")).toBeTruthy()
    expect(screen.getByText("Desde $900 por hora")).toBeTruthy()
  })
})

describe("Si no existe o si falló la API", () => {
  const params = Promise.resolve({ slug: "kayak-sur-4" })
  it("si no existe, 404", async () => {
    fail = 404
    await expect(KayakDetailPage({ params })).rejects.toThrow("404")
    fail = null
  })

  it("si la API falla no dice que no existe: el error sigue hasta la pantalla de error", async () => {
    fail = 503
    await expect(KayakDetailPage({ params })).rejects.toThrow("caído")
    fail = null
  })
})

describe("SEO", () => {
  it("canónica con el nombre de hoy y migas de pan con la playa", async () => {
    kayak = { ...base, name: "Kayak Sur ", spot_slug: "playa", spot_name: "Playa Brava" }
    const { generateMetadata, default: Page } = await import("./page")
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "nombre-viejo-4" }) })
    expect(meta.title).toBe("Kayak Sur | Rumbo")
    expect(meta.alternates?.canonical).toBe("/kayak/kayak-sur-4")
    const { container } = render(await Page({ params: Promise.resolve({ slug: "kayak-sur-4" }) }))
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "[]")
    const crumbs = ld.find((x: { "@type": string }) => x["@type"] === "BreadcrumbList")
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Inicio", "Playa Brava", "Kayak Sur"])
  })
})
