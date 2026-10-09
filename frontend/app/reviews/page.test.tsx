import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// Sesión, router y API simulados con valores comunes, no vi.fn.
let sessionState: { data: unknown; status: string } = { data: { id_token: "t" }, status: "authenticated" }
let reviews: unknown[] = []
let failGet = false
let calls: { method: string; url: string; body?: unknown }[] = []
let pushed: string[] = []
vi.mock("next-auth/react", () => ({ useSession: () => sessionState }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (u: string) => pushed.push(u) }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => <p>pantalla de carga</p> }))
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => { calls.push({ method: "get", url }); return failGet ? Promise.reject(new Error("500")) : Promise.resolve({ data: reviews }) },
    patch: (url: string, body: unknown) => { calls.push({ method: "patch", url, body }); return Promise.resolve({ data: { rating: 2, comment: "Cambió", updated_at: "2026-10-01T00:00:00" } }) },
    del: (url: string) => { calls.push({ method: "del", url }); return Promise.resolve({ data: null }) },
  },
}))

const { default: MyReviewsPage } = await import("./page")

const spotReview = { kind: "spot", id: 1, target_name: "Cerro Arequita", href: "/spots/cerro#reviews", rating: 5, comment: "Hermoso", created_at: "2026-09-01T00:00:00", updated_at: null }
const surfReview = { kind: "surf", id: 7, target_name: "Escuela Ola", href: "/surf/escuela-ola-4#reviews", rating: 4, comment: null, created_at: "2026-09-02T00:00:00", updated_at: null }

afterEach(() => {
  sessionState = { data: { id_token: "t" }, status: "authenticated" }
  reviews = []; failGet = false; calls = []; pushed = []
})

const load = async () => { render(<MyReviewsPage />); await act(() => Promise.resolve()) }

describe("Mis reseñas", () => {
  it("sin sesión vuelve al inicio, como las otras páginas del perfil", () => {
    sessionState = { data: null, status: "unauthenticated" }
    render(<MyReviewsPage />)
    expect(pushed).toEqual(["/"])
    expect(calls).toEqual([])
  })

  it("las de lugares, escuelas y kayaks, cada una lleva a sus reseñas", async () => {
    reviews = [surfReview, spotReview]
    await load()
    expect(screen.getByRole("heading", { name: "Mis reseñas" })).toBeTruthy()
    expect(screen.getByText("🏄 Escuela de surf")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Escuela Ola" }).getAttribute("href")).toBe("/surf/escuela-ola-4#reviews")
    expect(screen.getByRole("link", { name: "Cerro Arequita" }).getAttribute("href")).toBe("/spots/cerro#reviews")
    expect(screen.getByRole("link", { name: "← Volver al perfil" })).toBeTruthy()
  })

  it("editar y borrar van al endpoint de su tipo", async () => {
    reviews = [surfReview]
    await load()
    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" })) })
    expect(calls.at(-1)).toEqual({ method: "patch", url: "/surf-reviews/7", body: { rating: 4, comment: "" } })
    expect(screen.getByText("Cambió")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    // El "Eliminar" del modal de confirmación es el último.
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: "Eliminar" }).at(-1)!) })
    expect(calls.at(-1)).toEqual({ method: "del", url: "/surf-reviews/7" })
    expect(screen.getByText("Todavía no escribiste reseñas")).toBeTruthy()
  })

  it("si falla la carga lo dice (antes decía que no había reseñas) y deja reintentar", async () => {
    failGet = true
    await load()
    expect(screen.getByRole("alert").textContent).toContain("No se pudieron cargar tus reseñas.")
    expect(screen.queryByText("Todavía no escribiste reseñas")).toBeNull()
    failGet = false
    reviews = [spotReview]
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    await act(() => Promise.resolve())
    expect(screen.getByText("Cerro Arequita")).toBeTruthy()
  })
})
