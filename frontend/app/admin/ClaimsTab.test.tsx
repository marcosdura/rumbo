import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import type { AdminClaim } from "./ClaimsTab"

let posts: { url: string; body: unknown }[] = []
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: { post: (url: string, body: unknown) => { posts.push({ url, body }); return Promise.resolve({ data: {} }) } },
}))

const { default: ClaimsTab } = await import("./ClaimsTab")

const claim: AdminClaim = {
  id: 3, user_email: "duenio@test.com", message: "Soy el encargado", created_at: "2026-10-07T12:00:00Z",
  spot: { id: 7, name: "Camping del Arroyo", slug: "camping-del-arroyo", department: "Rocha" },
}

afterEach(() => { posts = [] })

function renderTab() {
  const resolved: [number, boolean][] = []
  render(<ClaimsTab claims={[claim]} loadError={null} loading={false} token="t" onResolved={(c, ok) => resolved.push([c.id, ok])} />)
  return resolved
}

describe("ClaimsTab", () => {
  it("muestra el lugar, quién lo pide y su mensaje", () => {
    renderTab()
    expect(screen.getByText("Camping del Arroyo")).toBeTruthy()
    expect(screen.getByText(/duenio@test.com/)).toBeTruthy()
    expect(screen.getByText("«Soy el encargado»")).toBeTruthy()
  })

  it("aprobar", async () => {
    const resolved = renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }))
    await act(() => Promise.resolve())
    expect(posts).toEqual([{ url: "/admin/claims/3/approve", body: undefined }])
    expect(resolved).toEqual([[3, true]])
  })

  it("rechazar pide el motivo", async () => {
    const resolved = renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }))
    fireEvent.click(screen.getAllByRole("button", { name: "Rechazar" }).at(-1)!)
    expect(screen.getByText("Escribí el motivo: es lo que va a ver quien lo pidió.")).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Motivo (obligatorio)"), { target: { value: "No pudimos verificarlo" } })
    fireEvent.click(screen.getAllByRole("button", { name: "Rechazar" }).at(-1)!)
    await act(() => Promise.resolve())
    expect(posts).toEqual([{ url: "/admin/claims/3/reject", body: { reason: "No pudimos verificarlo" } }])
    expect(resolved).toEqual([[3, false]])
  })
})
