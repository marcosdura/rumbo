import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"

// API simulada con valores comunes, no vi.fn: los lugares y qué pedidos fallan.
let spots: Record<string, unknown>[] = []
let failing: string[] = []
let calls: string[] = []
const queue = (count: number, oldest: string | null = null) => ({ count, oldest })
const pair = { current: 0, previous: 0 }
const emptySummary = {
  queues: { new_spots: queue(0), changes: queue(0), contributions: queue(0), operator_changes: queue(0), reports: queue(0), claims: queue(0) },
  metrics: { users: pair, reviews: pair, favorites: pair, views: pair, new_spots: pair },
  views_by_day: [], top_viewed: [], top_favorited: [],
  content_health: { no_photos: { count: 0, spots: [] }, no_description: { count: 0, spots: [] }, no_reviews: { count: 0, spots: [] } },
}
let summary: typeof emptySummary = emptySummary
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    constructor(public status: number, m: string) { super(m) }
  }
  const call = (method: string) => (url: string) => {
    calls.push(`${method} ${url}`)
    if (failing.some(f => url.includes(f))) return Promise.reject(new ApiError(500, "Error 500"))
    if (method === "get") return Promise.resolve({ data: url === "/admin/spots" ? spots : url === "/admin/summary" ? summary : [] })
    return Promise.resolve({ data: {} })
  }
  return { ApiError, api: { get: call("get"), patch: call("patch"), post: call("post"), del: call("del"), put: call("put") } }
})

const { default: AdminPage } = await import("./page")

const spot = (id: number, extra: object = {}) => ({
  id, name: `Lugar ${id}`, department: "Rocha", is_approved: false, owner_email: null, owner_deleted_at: null,
  slug: `lugar-${id}`, created_at: `2026-10-0${id}T00:00:00Z`, category: { name: "Camping" }, images: [], review_count: 0, ...extra,
})

afterEach(() => { spots = []; failing = []; calls = []; summary = emptySummary; window.history.replaceState(null, "", "/") })

const load = async () => { render(<AdminPage />); await act(() => Promise.resolve()) }
const open = async (name: RegExp) => { fireEvent.click(screen.getByRole("button", { name })); await act(() => Promise.resolve()) }
const loadNew = async () => { await load(); await open(/^🆕 Lugares nuevos/) }
const row = (name: string) => screen.getByText(name).closest(".spot-row") as HTMLElement

describe("Panel de admin: si una acción falla, se dice (antes la pantalla mostraba el cambio igual)", () => {
  it("aprobar falla: aviso y el lugar sigue pendiente", async () => {
    spots = [spot(1)]
    failing = ["/admin/spots/1/approve"]
    await loadNew()
    await act(async () => { fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Aprobar" })) })
    expect(screen.getByRole("alert").textContent).toContain("No se pudo aprobar «Lugar 1»")
    expect(within(row("Lugar 1")).getByText("Pendiente")).toBeTruthy()
  })

  it("aprobar anda: pasa a aprobado, sin aviso", async () => {
    spots = [spot(1)]
    await loadNew()
    await act(async () => { fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Aprobar" })) })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.queryByText("Lugar 1")).toBeNull() // ya no está entre los nuevos
  })

  it("eliminar falla: el modal queda abierto con el error y el lugar sigue", async () => {
    spots = [spot(1)]
    failing = ["/spots/1"]
    await loadNew()
    fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Eliminar" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByPlaceholderText("CONFIRMAR"), { target: { value: "CONFIRMAR" } })
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" })) })
    expect(within(screen.getByRole("dialog")).getByText(/No se pudo eliminar/)).toBeTruthy()
    expect(screen.getByText("Lugar 1")).toBeTruthy()
  })
})

describe("Aprobar todos", () => {
  it("pide confirmación antes", async () => {
    spots = [spot(1), spot(2)]
    await loadNew()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar todos (2)" }))
    expect(calls.filter(c => c.startsWith("patch"))).toEqual([])
    expect(screen.getByRole("dialog").textContent).toContain("¿Aprobar 2 lugares?")
  })

  it("si uno falla se frena ahí, con el aviso de cuál", async () => {
    spots = [spot(1), spot(2), spot(3)]
    failing = ["/admin/spots/2/approve"]
    await loadNew()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar todos (3)" }))
    await act(async () => { fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Aprobar todos" })) })
    // Más recientes primero: 3, 2 (falla) y el 1 no se intenta.
    expect(calls.filter(c => c.startsWith("patch"))).toEqual(["patch /admin/spots/3/approve", "patch /admin/spots/2/approve"])
    expect(screen.getByRole("alert").textContent).toContain("«Lugar 2»")
  })
})

describe("Link del lugar", () => {
  it("copia el link del sitio (antes decía rumboapp.uy, que no es nuestro)", async () => {
    let copied = ""
    Object.assign(navigator, { clipboard: { writeText: (t: string) => { copied = t; return Promise.resolve() } } })
    spots = [spot(1)]
    await loadNew()
    fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Copiar link" }))
    expect(copied).toBe(`${window.location.origin}/spots/lugar-1`)
  })
})

describe("Otras acciones que fallan", () => {
  it("reactivar falla: aviso y el lugar sigue en cuentas eliminadas", async () => {
    spots = [spot(1, { owner_deleted_at: "2026-09-01T00:00:00Z" })]
    failing = ["/reactivate"]
    await loadNew()
    await open(/^👤 Cuentas eliminadas/)
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reactivar" })) })
    expect(screen.getByRole("alert").textContent).toContain("No se pudo reactivar «Lugar 1»")
    expect(screen.getByRole("button", { name: "Reactivar" })).toBeTruthy()
  })

  it("foto principal falla: aviso y la principal no cambia", async () => {
    spots = [spot(1, { images: [{ cloudinary_public_id: "a", is_main: true, order: 0 }, { cloudinary_public_id: "b", is_main: false, order: 1 }] })]
    failing = ["/main-image"]
    await loadNew()
    await open(/^📷 Fotos/)
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Hacer principal" })) })
    expect(screen.getByRole("alert").textContent).toContain("No se pudo cambiar la foto principal")
    expect(screen.getAllByText("Principal")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Hacer principal" })).toBeTruthy()
  })
})

describe("Organización del panel", () => {
  it("arranca en el resumen y solo pide eso (antes eran 6 pedidos, con todos los lugares)", async () => {
    await load()
    expect(calls).toEqual(["get /admin/summary"])
    expect(screen.getByRole("button", { name: "📊 Resumen" }).getAttribute("aria-current")).toBe("page")
  })

  it("cada lista se pide recién al abrir su pestaña, una sola vez", async () => {
    await load()
    await open(/^⚑ Reportes/)
    await open(/^📝 Cambios y aportes/)
    await open(/^⚑ Reportes/)
    expect(calls.filter(c => c !== "get /admin/summary")).toEqual([
      "get /admin/reports", "get /admin/change-requests", "get /admin/contributions", "get /admin/operator-change-requests",
    ])
  })

  it("los contadores de las pestañas salen del resumen hasta que se abre cada una", async () => {
    summary = { ...emptySummary, queues: { ...emptySummary.queues, new_spots: queue(3), changes: queue(1), contributions: queue(2), reports: queue(4) } }
    await load()
    expect(screen.getByRole("button", { name: "🆕 Lugares nuevos (3)" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "📝 Cambios y aportes (3)" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "⚑ Reportes (4)" })).toBeTruthy()
  })

  it("tocar una cola del resumen lleva a su pestaña, y queda en la URL", async () => {
    summary = { ...emptySummary, queues: { ...emptySummary.queues, claims: queue(1, "2026-10-01T00:00:00Z") } }
    await load()
    await open(/Pedidos de responsables/)
    expect(screen.getByRole("button", { name: /^🙋 Responsables/ }).getAttribute("aria-current")).toBe("page")
    expect(window.location.search).toBe("?tab=reclamos")
  })

  it("entrar con ?tab=reportes abre esa pestaña (los avisos de admin llevan ahí)", async () => {
    window.history.replaceState(null, "", "/admin?tab=reportes")
    await load()
    expect(screen.getByRole("button", { name: /^⚑ Reportes/ }).getAttribute("aria-current")).toBe("page")
    expect(calls).toContain("get /admin/reports")
  })

  it("una pestaña que no existe en la URL deja el resumen", async () => {
    window.history.replaceState(null, "", "/admin?tab=cualquiera")
    await load()
    expect(screen.getByRole("button", { name: "📊 Resumen" }).getAttribute("aria-current")).toBe("page")
  })

  it("Lugares (gestión) muestra todos, con los filtros; Lugares nuevos, solo los pendientes", async () => {
    spots = [spot(1), spot(2, { is_approved: true })]
    await load()
    await open(/^🗺️ Lugares/)
    expect(screen.getByText("Lugar 1")).toBeTruthy()
    expect(screen.getByText("Lugar 2")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Todos" })).toBeTruthy()
    await open(/^🆕 Lugares nuevos/)
    expect(screen.queryByText("Lugar 2")).toBeNull()
    expect(screen.queryByRole("button", { name: "Todos" })).toBeNull()
  })
})

describe("Avisos de admin", () => {
  it("cada pestaña a la que llevan los avisos del backend existe en el panel", async () => {
    const { readFileSync } = await import("node:fs")
    const { ADMIN_MODES } = await import("./types")
    const backend = readFileSync("../backend/notifications.py", "utf-8")
    const block = backend.slice(backend.indexOf("ADMIN_TABS = {"), backend.indexOf("}", backend.indexOf("ADMIN_TABS = {")))
    const tabs = [...block.matchAll(/:\s*"([a-z-]+)"/g)].map(m => m[1])
    expect(tabs.length).toBeGreaterThan(5)
    for (const t of tabs) expect(ADMIN_MODES).toContain(t)
  })
})

describe("Escuelas y servicios", () => {
  it("es una pestaña de Gestión y pide la lista al abrirla", async () => {
    await load()
    expect(calls).not.toContain("get /admin/operators")
    await open(/^🏄 Escuelas y servicios/)
    expect(calls).toContain("get /admin/operators")
    expect(window.location.search).toBe("?tab=escuelas")
  })
})
