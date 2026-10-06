import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { AppNotification } from "@/lib/notifications"

// API y router simulados con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let unread = 2
let items: AppNotification[] = []
let posts: string[] = []
let pushed: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => Promise.resolve({ data: url.endsWith("unread-count") ? { unread } : { unread, items } }),
    post: (url: string) => { posts.push(url); return Promise.resolve({ data: { ok: true } }) },
  },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (url: string) => pushed.push(url) }) }))

const { default: NotificationBell } = await import("./NotificationBell")

afterEach(() => {
  unread = 2
  posts = []
  pushed = []
})

const approved: AppNotification = { id: 1, kind: "spot_approved", title: "Tu lugar «Cascada» fue aprobado", body: "Ya está publicado.", link: "/spots/cascada", created_at: null, read: false }
const old: AppNotification = { id: 2, kind: "new_review", title: "Nueva reseña", body: null, link: null, created_at: null, read: true }

describe("NotificationBell", () => {
  it("muestra cuántas hay sin leer", async () => {
    render(<NotificationBell token="t" />)
    expect(await screen.findByText("2")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Notificaciones (2 sin leer)" })).toBeTruthy()
  })

  it("sin avisos sin leer no hay globito", async () => {
    unread = 0
    render(<NotificationBell token="t" />)
    await screen.findByRole("button", { name: "Notificaciones" })
    expect(screen.queryByText("0")).toBeNull()
  })

  it("al abrir lista las últimas y tocar una la marca leída y lleva a su link", async () => {
    items = [approved, old]
    render(<NotificationBell token="t" />)
    fireEvent.click(await screen.findByRole("button", { name: "Notificaciones (2 sin leer)" }))
    fireEvent.click(await screen.findByText("Tu lugar «Cascada» fue aprobado"))
    expect(posts).toEqual(["/notifications/1/read"])
    expect(pushed).toEqual(["/spots/cascada"])
  })

  it("una ya leída no se vuelve a marcar", async () => {
    items = [old]
    render(<NotificationBell token="t" />)
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }))
    fireEvent.click(await screen.findByText("Nueva reseña"))
    expect(posts).toEqual([])
  })

  it("marcar todas como leídas", async () => {
    items = [approved]
    render(<NotificationBell token="t" />)
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }))
    fireEvent.click(await screen.findByRole("button", { name: "Marcar todas como leídas" }))
    await waitFor(() => expect(posts).toEqual(["/notifications/read-all"]))
    expect(screen.queryByText("2")).toBeNull()
  })

  it("sin avisos", async () => {
    unread = 0
    items = []
    render(<NotificationBell token="t" />)
    fireEvent.click(await screen.findByRole("button", { name: "Notificaciones" }))
    expect(await screen.findByText("No tenés notificaciones.")).toBeTruthy()
  })
})
