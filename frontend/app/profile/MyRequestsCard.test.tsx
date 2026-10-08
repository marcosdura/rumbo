import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import type { MyRequest } from "@/lib/requests"

let items: MyRequest[] = []
let posts: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: () => Promise.resolve({ data: items }),
    post: (url: string) => { posts.push(url); return Promise.resolve({ data: {} }) },
  },
}))

const { default: MyRequestsCard } = await import("./MyRequestsCard")

afterEach(() => {
  items = []
  posts = []
})

const flush = () => act(() => Promise.resolve())

const change: MyRequest = {
  kind: "spot_change", id: 1, status: "pending", fields: ["name", "photos_added"], photo_count: 2,
  target: { name: "Mi camping", href: "/dashboard/spots/3" }, reject_reason: null,
  created_at: null, resolved_at: null, dismiss_url: "/spots/3/change-request/dismiss",
}
const claim: MyRequest = {
  kind: "claim", id: 7, status: "rejected", fields: [],
  target: { name: "Camping del Arroyo", href: "/spots/camping-del-arroyo" }, reject_reason: "No pudimos verificarlo",
  created_at: null, resolved_at: null, dismiss_url: "/me/claims/7/dismiss",
}

describe("Mis pedidos", () => {
  it("un cambio en revisión: qué pediste y el link al panel; no se cierra", async () => {
    items = [change]
    render(<MyRequestsCard token="t" />)
    await flush()
    expect(screen.getByText("Cambio en Mi camping")).toBeTruthy()
    expect(screen.getByText("Pediste cambiar nombre y 2 fotos nuevas")).toBeTruthy()
    expect(screen.getByText("En revisión")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Administrar →" }).getAttribute("href")).toBe("/dashboard/spots/3")
    expect(screen.queryByRole("button", { name: /Cerrar aviso/ })).toBeNull()
  })

  it("un reclamo rechazado muestra el motivo y se cierra", async () => {
    items = [claim]
    render(<MyRequestsCard token="t" />)
    await flush()
    expect(screen.getByText("Hacerte cargo de Camping del Arroyo")).toBeTruthy()
    expect(screen.getByText("Motivo: No pudimos verificarlo")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ver →" }).getAttribute("href")).toBe("/spots/camping-del-arroyo")
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso de Hacerte cargo de Camping del Arroyo" }))
    await flush()
    expect(posts).toEqual(["/me/claims/7/dismiss"])
    expect(screen.queryByText("Hacerte cargo de Camping del Arroyo")).toBeNull()
  })

  it("sin pedidos explica qué va a aparecer", async () => {
    render(<MyRequestsCard token="t" />)
    await flush()
    expect(screen.getByText(/No tenés pedidos/)).toBeTruthy()
  })
})
