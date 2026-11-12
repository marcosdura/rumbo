import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import type { BlogPostData } from "@/lib/blog"

// El mapa (Leaflet) no corre en jsdom: se reemplaza por uno que dice qué
// punto tiene resaltado y cuál le pidieron mostrar.
vi.mock("next/dynamic", () => ({
  default: () => function FakeMap({ activeId, selected }: { activeId: string | null; selected: { id: string } | null }) {
    return <div data-testid="map" data-active={activeId ?? ""} data-selected={selected?.id ?? ""} />
  },
}))
vi.mock("next-cloudinary", () => ({ CldImage: () => null }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null, status: "unauthenticated" }) }))

const { default: BlogArticle } = await import("./BlogArticle")

const spot = {
  id: 7, name: "Cerro Arequita", slug: "cerro-arequita", department: "Lavalleja", lat: -34.28, lng: -55.26,
  categories: [{ name: "Trekking" }], images: [], review_count: 0, average_rating: null,
}

function post(overrides: Partial<BlogPostData> = {}): BlogPostData {
  return {
    slug: "refugios", title: "Travesía de refugios", summary: "Dos días", cover_image: null, category: "refugios",
    region: "Bariloche, Argentina", featured: false, published_at: "2026-11-01T12:00:00Z", updated_at: null,
    reading_minutes: 4, points_count: 2, has_map: true,
    map: {
      points: [
        { id: "frey", name: "Refugio Frey", type: "refugio", lat: -41.18, lng: -71.47, note: null, image: null, url: "https://example.com/frey" },
        { id: "arequita", spot_id: 7, note: null },
      ],
      tracks: [{ id: "ida", name: "La ida", points: [[-41.1, -71.4, 1000], [-41.2, -71.5, 1700]], distance_km: 12.3, elevation_gain: 700, elevation_loss: null }],
    },
    blocks: [
      { type: "heading", level: 2, text: "Día 1" },
      { type: "point", point: "frey", text: "Llegás en **4 horas**." },
      { type: "point", point: "arequita", text: null },
      { type: "gpx", track: "ida" },
      { type: "video", platform: "youtube", video_id: "abcdefghijk", url: "https://youtu.be/abcdefghijk", title: "El video", cover: null },
      { type: "video", platform: "instagram", video_id: "C1a2b3", url: "https://www.instagram.com/reel/C1a2b3/", title: "El reel", cover: null },
    ],
    spots: { "7": spot as unknown as BlogPostData["spots"][string] },
    related: [],
    ...overrides,
  }
}

describe("Una nota con mapa", () => {
  it("numera los puntos del texto igual que en el mapa", () => {
    render(<BlogArticle post={post()} />)
    const frey = document.getElementById("punto-frey")!
    expect(within(frey).getByText("1")).toBeTruthy()
    expect(within(frey).getByText("Refugio Frey")).toBeTruthy()
    expect(within(frey).getByText("4 horas").tagName).toBe("STRONG")
    const arequita = document.getElementById("punto-arequita")!
    expect(within(arequita).getByText("2")).toBeTruthy()
    expect(within(arequita).getByRole("link", { name: "Ver en Rumbo →" }).getAttribute("href")).toBe("/spots/cerro-arequita")
    // El punto libre lleva a su link, afuera.
    expect(within(frey).getByRole("link", { name: "Más info ↗" }).getAttribute("target")).toBe("_blank")
  })

  it("pasar por un punto lo resalta en el mapa; tocar «Ver en el mapa» lo muestra", () => {
    render(<BlogArticle post={post()} />)
    const frey = document.getElementById("punto-frey")!
    fireEvent.mouseEnter(frey)
    expect(screen.getByTestId("map").dataset.active).toBe("frey")
    fireEvent.mouseLeave(frey)
    expect(screen.getByTestId("map").dataset.active).toBe("")
    fireEvent.click(within(frey).getByRole("button", { name: "📍 Ver en el mapa" }))
    expect(screen.getByTestId("map").dataset.selected).toBe("frey")
  })

  it("el título con guardar y compartir en el mismo renglón (y en el celular, los íconos)", () => {
    render(<BlogArticle post={post()} />)
    const row = document.querySelector(".blog-title-row")!
    expect(within(row as HTMLElement).getByRole("heading", { level: 1, name: "Travesía de refugios" })).toBeTruthy()
    expect(within(row as HTMLElement).getByRole("button", { name: "Guardar" })).toBeTruthy()
    expect(within(row as HTMLElement).getByRole("button", { name: "🔗 Compartir" })).toBeTruthy()
    const bar = document.querySelector(".blog-mobile-actions") as HTMLElement
    expect(within(bar).getByRole("button", { name: "Guardar guía" })).toBeTruthy()
    expect(within(bar).getByRole("button", { name: "Compartir" })).toBeTruthy()
  })

  it("el mapa va en su tarjeta, dentro de la página (sin pantalla completa)", () => {
    const scrolled: unknown[] = []
    Element.prototype.scrollIntoView = function (this: Element, opts?: unknown) { scrolled.push([this.getAttribute("aria-label"), opts]) }
    render(<BlogArticle post={post()} />)
    const card = screen.getByRole("region", { name: "Mapa de Travesía de refugios" })
    expect(within(card).getByTestId("map")).toBeTruthy()
    expect(within(card).getByText(/Mapa de la guía · 2 puntos/)).toBeTruthy()
    expect(screen.queryByRole("dialog")).toBeNull()
    // "Ver en el mapa" sube hasta la tarjeta del mapa.
    fireEvent.click(within(document.getElementById("punto-frey")!).getByRole("button", { name: "📍 Ver en el mapa" }))
    expect(scrolled).toEqual([["Mapa de Travesía de refugios", { behavior: "smooth", block: "center" }]])
  })

  it("el recorrido con sus datos y los videos como links, sin incrustar", () => {
    render(<BlogArticle post={post()} />)
    expect(screen.getByText("12,3 km · ↗ 700 m")).toBeTruthy()
    expect(screen.getByRole("button", { name: "⬇ Descargar GPX" })).toBeTruthy()
    const youtube = screen.getByRole("link", { name: /El video/ })
    expect(youtube.getAttribute("href")).toBe("https://youtu.be/abcdefghijk")
    expect(youtube.querySelector("img")?.getAttribute("src")).toBe("https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg")
    expect(screen.getByRole("link", { name: /El reel/ }).textContent).toContain("Ver reel en Instagram")
    expect(document.querySelector("iframe")).toBeNull()
    // Los dos videos seguidos van en la misma fila.
    expect(document.querySelectorAll(".blog-videos")).toHaveLength(1)
  })
})

describe("Una nota sin mapa", () => {
  it("una sola columna, sin botones de mapa", () => {
    render(<BlogArticle post={post({ map: null, has_map: false, blocks: [{ type: "text", text: "Hola" }] })} />)
    expect(document.querySelector(".blog-map-card")).toBeNull()
    expect(screen.queryByTestId("map")).toBeNull()
    expect(screen.queryByText(/Ver mapa/)).toBeNull()
  })
})
