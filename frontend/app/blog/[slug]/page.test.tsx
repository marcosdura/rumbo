import { describe, expect, it, vi } from "vitest"

let fail: number | null = null
const nota = {
  slug: "refugios", title: "Travesía de refugios", summary: "Dos días por el Catedral", cover_image: "rumbo/blog/tapa",
  category: "refugios", region: "Bariloche", published_at: "2026-11-01T12:00:00Z", updated_at: null,
  map: null, blocks: [], spots: {}, related: [],
}
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async () => {
      const { ApiError } = await import("@/lib/api")
      if (fail) throw new ApiError(fail, fail === 404 ? "No encontrado" : "caído")
      return { data: nota }
    },
  },
}))
vi.mock("@/components/blog/BlogArticle", () => ({ default: () => null }))

const { default: BlogPostPage, generateMetadata } = await import("./page")

describe("La página de una nota", () => {
  it("al compartir: la tapa recortada, tipo artículo y su fecha", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "refugios" }) })
    expect(meta.title).toBe("Travesía de refugios | Rumbo")
    expect(meta.description).toBe("Dos días por el Catedral")
    const og = meta.openGraph as { type: string; publishedTime: string; images: { url: string }[] }
    expect(og.type).toBe("article")
    expect(og.publishedTime).toBe("2026-11-01T12:00:00Z")
    expect(og.images[0].url).toMatch(/c_fill,g_auto,w_1200,h_630.*\/rumbo\/blog\/tapa$/)
  })

  it("si no existe (o es un borrador), 404", async () => {
    fail = 404
    await expect(BlogPostPage({ params: Promise.resolve({ slug: "borrador" }) })).rejects.toThrow("404")
    fail = null
  })

  it("si la API falla no dice que no existe", async () => {
    fail = 503
    await expect(BlogPostPage({ params: Promise.resolve({ slug: "caido" }) })).rejects.toThrow("caído")
    fail = null
  })
})
