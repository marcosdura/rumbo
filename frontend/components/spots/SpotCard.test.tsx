import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { readFileSync } from "node:fs"

let imageProps: Record<string, unknown> = {}
const allImages: Record<string, unknown>[] = []
vi.mock("next-cloudinary", () => ({
  CldImage: (p: Record<string, unknown>) => { imageProps = p; allImages.push(p); return <img alt={String(p.alt)} /> },
}))

// Los estilos de la card están en SpotCard.css (antes, un <style> en cada card).
const css = readFileSync("components/spots/SpotCard.css", "utf-8")
vi.mock("@/components/spot-detail/FavoriteButton", () => ({ default: () => <button>favorito</button> }))

// SpotCard es .jsx: TypeScript infiere sus props como obligatorias.
const SpotCard = (await import("./SpotCard")).default as unknown as (props: { spot: Record<string, unknown>; priority?: boolean }) => React.ReactElement
const SpotList = (await import("./SpotList")).default as unknown as (props: { spots: Record<string, unknown>[]; eager?: boolean }) => React.ReactElement

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

  it("no trae su propio <style>: con muchas cards, el CSS se repetía en el HTML una vez por card", () => {
    const { container } = render(<><SpotCard spot={base} /><SpotCard spot={{ ...base, id: 2 }} /></>)
    expect(container.querySelectorAll("style")).toHaveLength(0)
    expect(css).toMatch(/\.spot-card \{[^}]*border-radius: 20px;/)
  })

  it("la foto carga cuando hace falta, salvo en las cards de arriba", () => {
    render(<SpotCard spot={base} />)
    expect(imageProps.loading).toBe("lazy")
    expect(imageProps.priority).toBeUndefined()
    render(<SpotCard spot={base} priority />)
    expect(imageProps.priority).toBe(true)
    expect(imageProps.loading).toBeUndefined()
  })

  it("en la primera fila, solo las primeras 4 cards cargan la foto de entrada", () => {
    const spots = Array.from({ length: 6 }, (_, i) => ({ ...base, id: i + 1, slug: `l${i}` }))
    allImages.length = 0
    render(<SpotList spots={spots} eager />)
    expect(allImages.map(p => p.priority === true)).toEqual([true, true, true, true, false, false])
    allImages.length = 0
    render(<SpotList spots={spots} />)
    expect(allImages.some(p => p.priority)).toBe(false)
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
    expect(css).toMatch(/\.spot-card-badges \{[^}]*flex-wrap: nowrap;/)
    expect(badges.querySelector(".spot-card-pill-text")).toBeTruthy()
  })

  it("celular: el +n abre las otras actividades y un toque en otro lado (o un scroll) las cierra", () => {
    const matchMedia = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: false, media: q })) as unknown as typeof window.matchMedia
    try {
      render(<SpotCard spot={{ ...base, categories: [{ name: "Camping" }, { name: "Glamping" }, { name: "Trekking" }] }} />)
      const plus = screen.getByText("+2")
      fireEvent.click(plus)
      expect(screen.getByText("🛖 Glamping")).toBeTruthy()
      // Tocar el mismo +n no la cierra por el lado de afuera (lo hace su click).
      fireEvent.pointerDown(plus)
      expect(screen.getByText("🛖 Glamping")).toBeTruthy()
      fireEvent.pointerDown(document.body)
      expect(screen.queryByText("🛖 Glamping")).toBeNull()

      fireEvent.click(plus)
      fireEvent.scroll(window)
      expect(screen.queryByText("🛖 Glamping")).toBeNull()
    } finally {
      window.matchMedia = matchMedia
    }
  })

  it("el nombre: la letra del texto de la portada, en negrita y sin la flecha", () => {
    const { container } = render(<SpotCard spot={base} />)
    expect(css).toMatch(/\.spot-card-name \{[^}]*font-family: var\(--font-dm-sans\)[^}]*font-weight: 700;/)
    expect(container.querySelector("svg")).toBeNull()
  })

  it("sin precio, temporada ni mascotas no deja un renglón en blanco", () => {
    const { container } = render(<SpotCard spot={base} />)
    expect(container.querySelector(".spot-card-facts")).toBeNull()
    expect(css).not.toMatch(/\.spot-card-facts \{[^}]*min-height/)
  })

  it("el nombre ocupa hasta dos renglones y termina en …; entero al pasar por encima", () => {
    render(<SpotCard spot={base} />)
    expect(css).toMatch(/\.spot-card-name \{[^}]*-webkit-line-clamp: 2;[^}]*overflow: hidden;/)
    expect(screen.getByText("Camping del Arroyo").getAttribute("title")).toBe("Camping del Arroyo")
  })

  it("compacta: poco espacio entre el nombre, las reseñas, los datos y la categoría", () => {
    render(<SpotCard spot={base} />)
    const margin = (cls: string) => css.match(new RegExp(`\\.${cls} \\{[^}]*margin: 0 0 (\\d+)px`))?.[1]
    expect([margin("spot-card-name"), margin("spot-card-rating"), margin("spot-card-facts")]).toEqual(["1", "4", "5"])
    expect(css).toContain(".spot-card-body { padding: 8px 12px 10px; }")
  })
})

describe("SpotCard: hover sin saltito", () => {
  it("la foto no hace zoom (al terminar, el navegador la redibujaba y se notaba un ajuste); la card sube", () => {
    expect(css).not.toMatch(/\.spot-card:hover \.spot-card-img-wrap img/)
    expect(css).not.toMatch(/scale\(/)
    expect(css).toMatch(/\.spot-card:hover \{[^}]*transform: translateY\(-3px\);/)
  })
})
