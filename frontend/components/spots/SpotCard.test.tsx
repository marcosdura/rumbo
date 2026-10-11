import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let imageProps: Record<string, unknown> = {}
vi.mock("next-cloudinary", () => ({
  CldImage: (p: Record<string, unknown>) => { imageProps = p; return <img alt={String(p.alt)} /> },
}))
vi.mock("@/components/spot-detail/FavoriteButton", () => ({ default: () => <button>favorito</button> }))

// SpotCard es .jsx: TypeScript infiere sus props como obligatorias.
const SpotCard = (await import("./SpotCard")).default as unknown as (props: { spot: Record<string, unknown> }) => React.ReactElement

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

  it("debajo del nombre: Departamento · reseñas (estrellas, Nuevo o Sin reseñas)", () => {
    const { unmount } = render(<SpotCard spot={{ ...base, review_count: 12, average_rating: 4.6 }} />)
    expect(screen.getByText("4.6 (12)").parentElement!.textContent).toBe("Rocha·★4.6 (12)")
    unmount()
    render(<SpotCard spot={base} />)
    expect(screen.getByText("Sin reseñas").parentElement!.textContent).toBe("Rocha·Sin reseñas")
  })

  it("el departamento ya no es una pill", () => {
    const { container } = render(<SpotCard spot={base} />)
    const badges = container.querySelector(".spot-card-badges")!
    expect(badges.textContent).not.toContain("Rocha")
  })

  it("mascotas: solo el emoji, y al pasar por encima dice qué es", () => {
    render(<SpotCard spot={{ ...base, price: 400, pets_allowed: true }} />)
    const facts = screen.getByText("$400 / noche · 🐶")
    expect(facts.getAttribute("title")).toBe("$400 / noche · Acepta mascotas")
  })

  it("la categoría abajo, con el +n en la misma línea; el texto se achica si no entra", () => {
    const { container } = render(<SpotCard spot={{ ...base, categories: [{ name: "Camping" }, { name: "Glamping" }, { name: "Trekking" }] }} />)
    const badges = container.querySelector(".spot-card-badges")!
    expect(badges.textContent).toBe("🏕️ Camping+2")
    const css = Array.from(container.querySelectorAll("style")).map(s => s.textContent).join("")
    expect(css).toMatch(/\.spot-card-badges \{[^}]*flex-wrap: nowrap;/)
    expect(badges.querySelector(".spot-card-pill-text")).toBeTruthy()
  })

  it("el nombre: la letra del texto de la portada, en negrita y sin la flecha", () => {
    const { container } = render(<SpotCard spot={base} />)
    const css = Array.from(container.querySelectorAll("style")).map(s => s.textContent).join("")
    expect(css).toMatch(/\.spot-card-name \{[^}]*font-family: var\(--font-dm-sans\)[^}]*font-weight: 700;/)
    expect(container.querySelector("svg")).toBeNull()
  })

  it("sin precio, temporada ni mascotas no deja un renglón en blanco", () => {
    const { container } = render(<SpotCard spot={base} />)
    expect(container.querySelector(".spot-card-facts")).toBeNull()
    const css = Array.from(container.querySelectorAll("style")).map(s => s.textContent).join("")
    expect(css).not.toMatch(/\.spot-card-facts \{[^}]*min-height/)
  })

  it("el nombre ocupa hasta dos renglones y termina en …; entero al pasar por encima", () => {
    const { container } = render(<SpotCard spot={base} />)
    const css = Array.from(container.querySelectorAll("style")).map(s => s.textContent).join("")
    expect(css).toMatch(/\.spot-card-name \{[^}]*-webkit-line-clamp: 2;[^}]*overflow: hidden;/)
    expect(screen.getByText("Camping del Arroyo").getAttribute("title")).toBe("Camping del Arroyo")
  })
})
