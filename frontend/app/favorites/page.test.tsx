import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

// API, sesión y router simulados con valores comunes, no vi.fn.
let favorites: unknown[] = []
let pushed: string[] = []
let session: { data: unknown; status: string } = { data: { id_token: "t" }, status: "authenticated" }
vi.mock("@/lib/api", () => ({ api: { get: () => Promise.resolve({ data: favorites }) } }))
vi.mock("next-auth/react", () => ({ useSession: () => session }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (u: string) => pushed.push(u) }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => null }))
vi.mock("@/components/spots/SpotCard", () => ({ default: ({ spot }: { spot: { name: string } }) => <article>{spot.name}</article> }))

const { default: FavoritesPage } = await import("./page")
const { useFavoritesStore } = await import("@/store/favoritesStore")

afterEach(() => {
  favorites = []; pushed = []
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

  it("sin favoritos invita a explorar lugares", async () => {
    render(<FavoritesPage />)
    await act(() => Promise.resolve())
    expect(screen.getByText("Todavía no tenés favoritos")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Explorar lugares →" }).getAttribute("href")).toBe("/search")
  })

  it("sin sesión vuelve al inicio, como las otras páginas del perfil", () => {
    session = { data: null, status: "unauthenticated" }
    render(<FavoritesPage />)
    expect(pushed).toEqual(["/"])
  })
})
