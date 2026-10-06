import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

let items: unknown[] = []
vi.mock("@/lib/api", () => ({
  api: { get: () => Promise.resolve({ data: { unread: 0, items } }), post: () => Promise.resolve({ data: {} }) },
}))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))

const { default: NotificationsPage } = await import("./page")

describe("/notificaciones", () => {
  it("lista todas", async () => {
    items = [{ id: 1, kind: "contribution_approved", title: "Se publicó tu aporte «Sector Norte»", body: "en Cerro Arequita", link: "/spots/cerro", created_at: null, read: false }]
    render(<NotificationsPage />)
    expect(await screen.findByText("Se publicó tu aporte «Sector Norte»")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Marcar todas como leídas" })).toBeTruthy()
  })

  it("sin notificaciones explica qué va a aparecer", async () => {
    items = []
    render(<NotificationsPage />)
    expect(await screen.findByText(/No tenés notificaciones/)).toBeTruthy()
  })
})
