import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { BlogSummary } from "@/lib/blog"

vi.mock("next-cloudinary", () => ({ CldImage: () => null }))

const { default: BlogHome } = await import("./BlogHome")

const card = (slug: string, category: BlogSummary["category"], featured = false): BlogSummary => ({
  slug, title: `Nota ${slug}`, summary: null, cover_image: null, category, region: null, featured,
  published_at: "2026-11-01T12:00:00Z", updated_at: null, reading_minutes: 3, points_count: 0, has_map: false,
})

const posts = [card("a", "rutas"), card("b", "consejos", true), card("c", "rutas")]
const titles = () => screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent)

describe("Inicio del blog", () => {
  it("la destacada primero y después el resto", () => {
    render(<BlogHome posts={posts} />)
    expect(titles()).toEqual(["Nota b", "Nota a", "Nota c"])
    expect(screen.getByRole("link", { name: /Nota b/ }).className).toContain("is-featured")
  })

  it("filtra por categoría y deja el link para compartir", () => {
    render(<BlogHome posts={posts} />)
    fireEvent.click(screen.getByRole("button", { name: /Rutas/ }))
    expect(titles()).toEqual(["Nota a", "Nota c"])
    expect(window.location.search).toBe("?categoria=rutas")
    fireEvent.click(screen.getByRole("button", { name: /Todas/ }))
    expect(titles()).toHaveLength(3)
    expect(window.location.search).toBe("")
  })

  it("solo las categorías que tienen notas", () => {
    render(<BlogHome posts={posts} />)
    expect(screen.queryByRole("button", { name: /Equipo/ })).toBeNull()
  })

  it("entrando con la categoría en el link", () => {
    render(<BlogHome posts={posts} initialCategory="consejos" />)
    expect(titles()).toEqual(["Nota b"])
  })

  it("sin notas, invita a Instagram", () => {
    render(<BlogHome posts={[]} />)
    expect(screen.getByRole("link", { name: "Instagram" })).toBeTruthy()
  })
})
