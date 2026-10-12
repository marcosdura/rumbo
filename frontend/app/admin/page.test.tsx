import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"

// API simulada con valores comunes, no vi.fn: los lugares y qué pedidos fallan.
let spots: Record<string, unknown>[] = []
let failing: string[] = []
let calls: string[] = []
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    constructor(public status: number, m: string) { super(m) }
  }
  const call = (method: string) => (url: string) => {
    calls.push(`${method} ${url}`)
    if (failing.some(f => url.includes(f))) return Promise.reject(new ApiError(500, "Error 500"))
    if (method === "get") return Promise.resolve({ data: url === "/admin/spots" ? spots : [] })
    return Promise.resolve({ data: {} })
  }
  return { ApiError, api: { get: call("get"), patch: call("patch"), post: call("post"), del: call("del"), put: call("put") } }
})

const { default: AdminPage } = await import("./page")

const spot = (id: number, extra: object = {}) => ({
  id, name: `Lugar ${id}`, department: "Rocha", is_approved: false, owner_email: null, owner_deleted_at: null,
  slug: `lugar-${id}`, created_at: `2026-10-0${id}T00:00:00Z`, category: { name: "Camping" }, images: [], review_count: 0, ...extra,
})

afterEach(() => { spots = []; failing = []; calls = [] })

const load = async () => { render(<AdminPage />); await act(() => Promise.resolve()) }
const row = (name: string) => screen.getByText(name).closest(".spot-row") as HTMLElement

describe("Panel de admin: si una acción falla, se dice (antes la pantalla mostraba el cambio igual)", () => {
  it("aprobar falla: aviso y el lugar sigue pendiente", async () => {
    spots = [spot(1)]
    failing = ["/admin/spots/1/approve"]
    await load()
    await act(async () => { fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Aprobar" })) })
    expect(screen.getByRole("alert").textContent).toContain("No se pudo aprobar «Lugar 1»")
    expect(within(row("Lugar 1")).getByText("Pendiente")).toBeTruthy()
  })

  it("aprobar anda: pasa a aprobado, sin aviso", async () => {
    spots = [spot(1)]
    await load()
    fireEvent.click(screen.getByRole("button", { name: "Aprobados" }))
    fireEvent.click(screen.getByRole("button", { name: /^Pendientes/ }))
    await act(async () => { fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Aprobar" })) })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.queryByText("Lugar 1")).toBeNull() // ya no está en Pendientes
  })

  it("eliminar falla: el modal queda abierto con el error y el lugar sigue", async () => {
    spots = [spot(1)]
    failing = ["/spots/1"]
    await load()
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
    await load()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar todos (2)" }))
    expect(calls.filter(c => c.startsWith("patch"))).toEqual([])
    expect(screen.getByRole("dialog").textContent).toContain("¿Aprobar 2 lugares?")
  })

  it("si uno falla se frena ahí, con el aviso de cuál", async () => {
    spots = [spot(1), spot(2), spot(3)]
    failing = ["/admin/spots/2/approve"]
    await load()
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
    await load()
    fireEvent.click(within(row("Lugar 1")).getByRole("button", { name: "Copiar link" }))
    expect(copied).toBe(`${window.location.origin}/spots/lugar-1`)
  })
})

describe("Otras acciones que fallan", () => {
  it("reactivar falla: aviso y el lugar sigue en cuentas eliminadas", async () => {
    spots = [spot(1, { owner_deleted_at: "2026-09-01T00:00:00Z" })]
    failing = ["/reactivate"]
    await load()
    fireEvent.click(screen.getByRole("button", { name: /Cuentas eliminadas/ }))
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reactivar" })) })
    expect(screen.getByRole("alert").textContent).toContain("No se pudo reactivar «Lugar 1»")
    expect(screen.getByRole("button", { name: "Reactivar" })).toBeTruthy()
  })

  it("foto principal falla: aviso y la principal no cambia", async () => {
    spots = [spot(1, { images: [{ cloudinary_public_id: "a", is_main: true, order: 0 }, { cloudinary_public_id: "b", is_main: false, order: 1 }] })]
    failing = ["/main-image"]
    await load()
    fireEvent.click(screen.getByRole("button", { name: /Gestión de fotos/ }))
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Hacer principal" })) })
    expect(screen.getByRole("alert").textContent).toContain("No se pudo cambiar la foto principal")
    expect(screen.getAllByText("Principal")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Hacer principal" })).toBeTruthy()
  })
})
