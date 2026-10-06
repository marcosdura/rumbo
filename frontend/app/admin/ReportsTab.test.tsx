import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReportGroup } from "./ReportsTab"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let posts: { url: string; body: unknown }[] = []
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { status = 0 },
  api: { post: (url: string, body: unknown) => { posts.push({ url, body }); return Promise.resolve({ data: { ok: true } }) } },
}))

const { default: ReportsTab } = await import("./ReportsTab")

const spotGroup: ReportGroup = {
  target_kind: "spot", target_id: 12, count: 2, actions: ["dismiss", "unpublish"],
  target: { exists: true, title: "Cerro Arequita", owner_email: "duenio@test.com", spot: { id: 12, name: "Cerro Arequita", slug: "cerro-arequita", is_approved: true } },
  reports: [
    { id: 1, reason: "closed", reason_label: "El lugar ya no existe o cerró", comment: "Pusieron un alambrado", reporter_email: "a@test.com", created_at: null },
    { id: 2, reason: "false_info", reason_label: "Información falsa o engañosa", comment: null, reporter_email: "b@test.com", created_at: null },
  ],
}

const reviewGroup: ReportGroup = {
  target_kind: "review", target_id: 7, count: 1, actions: ["delete", "dismiss"],
  target: { exists: true, title: "Reseña de Juan", rating: 1, comment: "Texto ofensivo", owner_email: "juan@test.com", spot: { id: 12, name: "Cerro Arequita", slug: "cerro-arequita", is_approved: true } },
  reports: [{ id: 3, reason: "offensive", reason_label: "Contenido ofensivo o inapropiado", comment: null, reporter_email: "c@test.com", created_at: null }],
}

let resolved: [ReportGroup, string][] = []
function renderTab(groups: ReportGroup[]) {
  render(<ReportsTab groups={groups} loadError={null} loading={false} token="t" onResolved={(g, a) => resolved.push([g, a])} />)
}

afterEach(() => {
  posts = []
  resolved = []
})

describe("ReportsTab", () => {
  it("muestra cuántas veces y por qué se reportó", () => {
    renderTab([spotGroup])
    expect(screen.getByText("2 reportes")).toBeTruthy()
    expect(screen.getByText("El lugar ya no existe o cerró")).toBeTruthy()
    expect(screen.getByText(/Pusieron un alambrado/)).toBeTruthy()
  })

  it("descartar resuelve sin preguntar", async () => {
    renderTab([spotGroup])
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }))
    await waitFor(() => expect(resolved).toEqual([[spotGroup, "dismiss"]]))
    expect(posts[0]).toEqual({ url: "/admin/reports/resolve", body: { target_kind: "spot", target_id: 12, action: "dismiss", reason: null } })
  })

  it("despublicar pide el motivo", async () => {
    renderTab([spotGroup])
    fireEvent.click(screen.getByRole("button", { name: "Despublicar" }))
    fireEvent.click(screen.getAllByRole("button", { name: "Despublicar" }).at(-1)!)
    expect(screen.getByText("Escribí el motivo: es lo que va a ver el dueño.")).toBeTruthy()
    expect(posts).toHaveLength(0)
    fireEvent.change(screen.getByLabelText("Motivo (obligatorio)"), { target: { value: "Cerró" } })
    fireEvent.click(screen.getAllByRole("button", { name: "Despublicar" }).at(-1)!)
    await waitFor(() => expect(posts[0]?.body).toMatchObject({ action: "unpublish", reason: "Cerró" }))
  })

  it("una reseña muestra su texto y se elimina con confirmación", async () => {
    renderTab([reviewGroup])
    expect(screen.getByText(/Texto ofensivo/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Despublicar" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Eliminar reseña" }))
    expect(posts).toHaveLength(0)
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(resolved).toEqual([[reviewGroup, "delete"]]))
  })

  it("si lo reportado ya no existe, solo se puede descartar", () => {
    renderTab([{ ...reviewGroup, target: { exists: false } }])
    expect(screen.getByText("Ya no existe")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Eliminar reseña" })).toBeNull()
    expect(screen.getByRole("button", { name: "Descartar" })).toBeTruthy()
  })

  it("sin reportes", () => {
    renderTab([])
    expect(screen.getByText("No hay reportes abiertos.")).toBeTruthy()
  })
})
