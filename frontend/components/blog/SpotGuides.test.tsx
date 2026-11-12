import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let answer: unknown = []
const get = vi.fn(async () => ({ data: answer }))
vi.mock("@/lib/api", () => ({ api: { get: (...a: unknown[]) => get(...(a as [])) } }))
vi.mock("next-cloudinary", () => ({ CldImage: () => null }))

const { default: SpotGuides } = await import("./SpotGuides")

const guide = (slug: string, title: string) => ({
  slug, title, summary: null, cover_image: null, category: "rutas", region: "Lavalleja", featured: false,
  published_at: "2026-11-01T12:00:00Z", updated_at: null, reading_minutes: 3, points_count: 2, has_map: true,
})

describe("Aparece en estas guías", () => {
  it("las notas que nombran el lugar, con link", async () => {
    answer = [guide("finde-lavalleja", "Un finde en Lavalleja")]
    render(<SpotGuides spotId={7} />)
    expect(await screen.findByRole("heading", { name: "📖 Aparece en esta guía" })).toBeTruthy()
    expect(screen.getByRole("link", { name: /Un finde en Lavalleja/ }).getAttribute("href")).toBe("/blog/finde-lavalleja")
    expect(get).toHaveBeenCalledWith("/blog/posts", expect.objectContaining({ params: { spot: 7 } }))
  })

  it("sin guías no muestra nada", async () => {
    answer = []
    const { container } = render(<SpotGuides spotId={7} />)
    await new Promise(r => setTimeout(r, 0))
    expect(container.textContent).toBe("")
  })
})
