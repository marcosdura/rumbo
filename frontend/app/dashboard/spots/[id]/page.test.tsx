import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// Sesión, router y API simulados con valores comunes, no vi.fn.
let mine: unknown[] = []
let failMine = false
let reviewPages: { data: unknown[]; totalCount: number }[] = []
let reviewParams: unknown[] = []
let pushed: string[] = []
let stats: { views_30d: number; favorites: number } | null = null
let patches: { body: Record<string, unknown>; dryRun: boolean }[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "5" }), useRouter: () => ({ push: (u: string) => pushed.push(u) }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("./ContentTab", () => ({ default: () => null }))
// El mapa (Leaflet) no corre en jsdom: un botón que elige un punto.
vi.mock("next/dynamic", () => ({
  default: () => ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) =>
    <button type="button" onClick={() => onLocationSelect(-34.5, -55.25)}>marcar en el mapa</button>,
}))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: {
    get: (url: string, opts?: { params?: unknown }) => {
      if (url === "/spots/mine") return failMine ? Promise.reject(new Error("500")) : Promise.resolve({ data: mine })
      if (url.endsWith("/owner-stats")) return stats ? Promise.resolve({ data: stats }) : Promise.reject(new Error("500"))
      reviewParams.push(opts?.params)
      return Promise.resolve(reviewPages.shift() ?? { data: [], totalCount: 0 })
    },
    patch: (_url: string, body: Record<string, unknown>, opts?: { params?: { dry_run?: boolean } }) => {
      patches.push({ body, dryRun: !!opts?.params?.dry_run })
      return Promise.resolve({ data: { applied: ["price"], pending: [] } })
    },
  },
}))

const { default: DashboardPage } = await import("./page")

const spot = (extra: object = {}) => ({
  id: 5, name: "Camping La Aguada", slug: "la-aguada", description: "Lindo", department: "Rocha",
  email: null, whatsapp: null, instagram: null, price: 450, season_start: null, season_end: null,
  is_public: null, public_transport: null, is_approved: true, category: { name: "Camping" },
  images: [], average_rating: null, review_count: 0, change_request: null, activities: ["Camping"], ...extra,
})
const review = (id: number) => ({ id, rating: 5, comment: `Reseña ${id}`, created_at: "2026-09-01T00:00:00", user: { name: "Ana", image: null } })

afterEach(() => { mine = []; failMine = false; reviewPages = []; reviewParams = []; pushed = []; stats = null; patches = [] })

const load = async () => { render(<DashboardPage />); await act(() => Promise.resolve()) }

describe("Panel del dueño", () => {
  it("si falla la carga lo dice y deja reintentar (antes quedaba cargando)", async () => {
    failMine = true
    await load()
    expect(screen.getByRole("alert").textContent).toContain("No se pudo cargar tu lugar.")
    failMine = false
    mine = [spot()]
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    await act(() => Promise.resolve())
    expect(screen.getByRole("heading", { name: "Camping La Aguada" })).toBeTruthy()
  })

  it("las reseñas se ven todas, de a tandas, con el total en la pestaña", async () => {
    mine = [spot()]
    reviewPages = [{ data: [review(1), review(2)], totalCount: 3 }, { data: [review(3)], totalCount: 3 }]
    await load()
    fireEvent.click(screen.getByRole("button", { name: "💬 Reseñas (3)" }))
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver más (1)" })) })
    expect(screen.getByText("Reseña 3")).toBeTruthy()
    expect(reviewParams).toEqual([{ limit: 50 }, { limit: 50, offset: 2 }])
    expect(screen.queryByRole("button", { name: /Ver más/ })).toBeNull()
  })

  it("Ver lugar solo si está publicado (sin aprobar daba 404)", async () => {
    mine = [spot({ is_approved: false })]
    await load()
    expect(screen.queryByRole("link", { name: "Ver lugar →" })).toBeNull()
  })

  it("publicado: Ver lugar lleva a su página", async () => {
    mine = [spot()]
    await load()
    expect(screen.getByRole("link", { name: "Ver lugar →" }).getAttribute("href")).toBe("/spots/la-aguada")
  })

  it("con cambios sin guardar, el navegador avisa antes de salir", async () => {
    mine = [spot()]
    await load()
    const before = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(before)
    expect(before.defaultPrevented).toBe(false)
    fireEvent.change(screen.getByDisplayValue("Camping La Aguada"), { target: { value: "Camping La Aguada Sur" } })
    const after = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(true)
  })

  it("muestra visitas de los últimos 30 días y cuántos lo guardaron", async () => {
    mine = [spot()]
    stats = { views_30d: 128, favorites: 7 }
    await load()
    await act(() => Promise.resolve())
    expect(screen.getByText("Visitas (30 días)").previousElementSibling!.textContent).toBe("128")
    expect(screen.getByText("En favoritos").previousElementSibling!.textContent).toBe("7")
  })

  it("si no llegan las estadísticas, el panel anda igual", async () => {
    mine = [spot()]
    await load()
    expect(screen.queryByText("Visitas (30 días)")).toBeNull()
    expect(screen.getByText("Reseñas")).toBeTruthy()
  })

  it("sin tocar el mapa no manda la ubicación (sin coordenadas daba error)", async () => {
    mine = [spot({ lat: null, lng: null })]
    await load()
    fireEvent.change(screen.getByDisplayValue("450"), { target: { value: "500" } })
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" })) })
    expect(patches.length).toBeGreaterThan(0)
    expect(patches.every(p => !("lat" in p.body) && !("lng" in p.body))).toBe(true)
  })

  it("la ubicación marcada en el mapa se manda al guardar", async () => {
    mine = [spot({ lat: -34, lng: -55 })]
    await load()
    fireEvent.click(screen.getByRole("button", { name: "marcar en el mapa" }))
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" })) })
    expect(patches[0].body).toMatchObject({ lat: -34.5, lng: -55.25 })
  })
})
