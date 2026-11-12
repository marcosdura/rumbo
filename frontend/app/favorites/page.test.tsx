import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

// API, sesión y router simulados con valores comunes, no vi.fn.
let favorites: unknown[] = []
let guides: unknown[] = []
const deleted: string[] = []
let pushed: string[] = []
let session: { data: unknown; status: string } = { data: { id_token: "t" }, status: "authenticated" }
vi.mock("@/lib/api", () => ({
  api: {
    get: (path: string) => Promise.resolve({ data: path === "/blog/saved" ? guides : favorites }),
    del: (path: string) => { deleted.push(path); return Promise.resolve({ data: null }) },
  },
}))
vi.mock("next-cloudinary", () => ({ CldImage: () => null }))
vi.mock("next-auth/react", () => ({ useSession: () => session }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (u: string) => pushed.push(u) }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => null }))
vi.mock("@/components/spots/SpotCard", () => ({ default: ({ spot }: { spot: { name: string } }) => <article>{spot.name}</article> }))

const { default: FavoritesPage } = await import("./page")
const { useFavoritesStore } = await import("@/store/favoritesStore")
const { useSavedGuidesStore } = await import("@/store/savedGuidesStore")

afterEach(() => {
  favorites = []; guides = []; pushed = []; deleted.length = 0
  ;(useSavedGuidesStore as unknown as { setState: (s: object) => void }).setState({ guides: [], loading: false, loadedFor: null })
  session = { data: { id_token: "t" }, status: "authenticated" }
  ;(useFavoritesStore as unknown as { setState: (s: object) => void }).setState({ favorites: [], loading: false })
})

describe("Favoritos", () => {
  it("las cards de la búsqueda, con el armazón del perfil y la cantidad", async () => {
    favorites = [{ id: 1, name: "Cerro Arequita" }, { id: 2, name: "Cabo Polonio" }]
    render(<FavoritesPage />)
    await act(() => Promise.resolve())
    expect(screen.getAllByRole("article").map(a => a.textContent)).toEqual(["Cerro Arequita", "Cabo Polonio"])
    expect(screen.getByRole("heading", { name: "Favoritos" })).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
    expect(screen.getByRole("link", { name: "← Volver al perfil" })).toBeTruthy()
  })

  it("las guías guardadas van en su propia sección, aparte de los lugares", async () => {
    favorites = [{ id: 1, name: "Cerro Arequita" }]
    guides = [{
      slug: "refugios", title: "Travesía de refugios", summary: null, cover_image: null, category: "refugios", region: null,
      featured: false, published_at: "2026-11-01T12:00:00Z", updated_at: null, reading_minutes: 4, points_count: 3, has_map: true,
    }]
    render(<FavoritesPage />)
    await act(() => Promise.resolve())
    expect(screen.getByRole("heading", { name: "❤️ Lugares" })).toBeTruthy()
    const section = screen.getByRole("region", { name: "🔖 Guías guardadas" })
    expect(section.id).toBe("guias")
    expect(screen.getByRole("link", { name: /Travesía de refugios/ }).getAttribute("href")).toBe("/blog/refugios")
    expect(screen.getAllByRole("article").map(a => a.textContent)).toEqual(["Cerro Arequita"])

    await act(async () => { screen.getByRole("button", { name: "Quitar «Travesía de refugios» de mis guías" }).click() })
    expect(deleted).toEqual(["/blog/posts/refugios/save"])
    expect(screen.queryByRole("region", { name: "🔖 Guías guardadas" })).toBeNull()
  })

  it("sin favoritos invita a explorar lugares", async () => {
    render(<FavoritesPage />)
    await act(() => Promise.resolve())
    expect(screen.getByText("Todavía no tenés favoritos")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Explorar lugares →" }).getAttribute("href")).toBe("/search")
  })

  it("sin sesión pide iniciarla ahí mismo (antes mandaba a la home sin explicar)", () => {
    session = { data: null, status: "unauthenticated" }
    render(<FavoritesPage />)
    expect(pushed).toEqual([])
    expect(screen.getByRole("heading", { name: "Iniciá sesión para ver esta página" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeTruthy()
  })
})
