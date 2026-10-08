import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let imageProps: Record<string, unknown> = {}
vi.mock("next-cloudinary", () => ({
  CldImage: (p: Record<string, unknown>) => { imageProps = p; return <img alt={String(p.alt)} /> },
}))
vi.mock("@/components/spot-detail/FavoriteButton", () => ({ default: () => <button>favorito</button> }))

const { default: SpotCard } = await import("./SpotCard")

const base = {
  id: 1, name: "Camping del Arroyo", slug: "camping-del-arroyo", department: "Rocha",
  category: { name: "Camping" }, categories: [{ name: "Camping" }],
  images: [{ cloudinary_public_id: "rumbo/spots/1/abc", is_main: true }],
  review_count: 0, average_rating: null, created_at: "2020-01-01T00:00:00Z",
}

describe("SpotCard", () => {
  it("abre el lugar en la misma pestaña, y el favorito no está adentro del link", () => {
    render(<SpotCard spot={base} />)
    const link = screen.getByRole("link")
    expect(link.getAttribute("href")).toBe("/spots/camping-del-arroyo")
    expect(link.getAttribute("target")).toBeNull()
    expect(link.contains(screen.getByRole("button", { name: "favorito" }))).toBe(false)
  })

  it("pide la foto del tamaño de la card, recortada donde está lo interesante", () => {
    render(<SpotCard spot={base} />)
    expect(imageProps).toMatchObject({ width: 480, height: 480, crop: "fill", gravity: "auto" })
  })

  it("siempre hay línea de calificación: estrellas, Nuevo o Sin reseñas", () => {
    const { unmount } = render(<SpotCard spot={{ ...base, review_count: 12, average_rating: 4.6 }} />)
    expect(screen.getByText("4.6 (12)")).toBeTruthy()
    unmount()
    render(<SpotCard spot={base} />)
    expect(screen.getByText("Sin reseñas")).toBeTruthy()
  })

  it("muestra el precio y si acepta mascotas", () => {
    render(<SpotCard spot={{ ...base, price: 400, pets_allowed: true }} />)
    expect(screen.getByText("$400 / noche · 🐶 Acepta mascotas")).toBeTruthy()
  })
})
