import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// API, sesión y router simulados con valores comunes, no vi.fn.
let pages: { unread: number; items: unknown[]; has_more?: boolean }[] = []
let gets: unknown[] = []
let posts: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: (_url: string, opts: { params: unknown }) => { gets.push(opts.params); return Promise.resolve({ data: pages.shift() ?? { unread: 0, items: [] } }) },
    post: (url: string) => { posts.push(url); return Promise.resolve({ data: {} }) },
  },
}))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))

const { default: NotificationsPage } = await import("./page")
const { getUnread, setUnread } = await import("@/components/layout/unreadStore")

const n = (id: number, read = false) => ({ id, kind: "contribution_approved", title: `Aviso ${id}`, body: null, link: null, created_at: null, read })

afterEach(() => { pages = []; gets = []; posts = []; setUnread(0) })

describe("/notificaciones", () => {
  it("lista todas, con el armazón del perfil", async () => {
    pages = [{ unread: 1, items: [n(1)] }]
    render(<NotificationsPage />)
    expect(await screen.findByText("Aviso 1")).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Notificaciones" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "← Volver al perfil" })).toBeTruthy()
  })

  it("sin notificaciones explica qué va a aparecer", async () => {
    render(<NotificationsPage />)
    expect(await screen.findByText(/No tenés notificaciones/)).toBeTruthy()
  })

  it("marcar todas como leídas baja también el número de la campanita", async () => {
    pages = [{ unread: 2, items: [n(1), n(2)] }]
    render(<NotificationsPage />)
    await screen.findByText("Aviso 1")
    expect(getUnread()).toBe(2)
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Marcar todas como leídas" })) })
    expect(getUnread()).toBe(0)
    expect(posts).toEqual(["/notifications/read-all"])
  })

  it("abrir una sin leer la descuenta de la campanita", async () => {
    pages = [{ unread: 2, items: [n(1), n(2)] }]
    render(<NotificationsPage />)
    fireEvent.click(await screen.findByText("Aviso 1"))
    expect(getUnread()).toBe(1)
  })

  it("Ver más trae las anteriores", async () => {
    pages = [{ unread: 0, items: [n(1, true), n(2, true)], has_more: true }, { unread: 0, items: [n(3, true)], has_more: false }]
    render(<NotificationsPage />)
    await screen.findByText("Aviso 2")
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ver más" })) })
    expect(screen.getByText("Aviso 3")).toBeTruthy()
    expect(gets.at(-1)).toEqual({ limit: 50, offset: 2 })
    expect(screen.queryByRole("button", { name: "Ver más" })).toBeNull()
  })
})
