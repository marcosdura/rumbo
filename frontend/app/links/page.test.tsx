import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let posts: unknown = []
let fails = false
vi.mock("@/lib/api", () => ({ api: { get: async () => { if (fails) throw new Error("caído"); return { data: posts } } } }))
vi.mock("next-cloudinary", () => ({ CldImage: () => null }))

const { default: LinksPage } = await import("./page")

const post = (slug: string, title: string, featured = false) => ({
  slug, title, summary: null, cover_image: null, category: "refugios", region: null, featured,
  published_at: "2026-11-01T12:00:00Z", updated_at: null, reading_minutes: 3, points_count: 0, has_map: false,
})

describe("/links: el link de la bio", () => {
  it("la guía destacada arriba y todos los links con utm de la bio", async () => {
    posts = [post("nueva", "La nueva"), post("refugios", "Refugios", true)]
    render(await LinksPage())
    const featured = screen.getByRole("link", { name: /Nueva guía\s*Refugios/ })
    expect(featured.getAttribute("href")).toBe("/blog/refugios?utm_source=instagram&utm_medium=bio&utm_campaign=refugios")
    expect(screen.getByRole("link", { name: "La nueva" }).getAttribute("href")).toContain("/blog/nueva?utm_source=instagram")
    for (const link of screen.getAllByRole("link").filter(a => a.getAttribute("href")!.startsWith("/"))) {
      expect(link.getAttribute("href")).toContain("utm_medium=bio")
    }
  })

  it("si el backend no contesta, quedan los links fijos", async () => {
    fails = true
    render(await LinksPage())
    expect(screen.getByRole("link", { name: "📖 Todas las guías del blog" })).toBeTruthy()
    fails = false
  })
})
