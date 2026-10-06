import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { Contribution } from "@/lib/contributions"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let mine: Contribution[]
let posts: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: () => Promise.resolve({ data: mine }),
    post: (url: string) => { posts.push(url); return Promise.resolve({ data: { ok: true } }) },
  },
}))

const { default: MyContributionsCard } = await import("./MyContributionsCard")

const spot = { id: 3, name: "Cerro Arequita", slug: "cerro-arequita", department: "Lavalleja", category: { name: "Escalada" } }
function contribution(overrides: Partial<Contribution>): Contribution {
  return {
    id: 1, kind: "climbing_sector", item_id: 9, spot_id: 3, status: "pending", title: "Sector Norte",
    reject_reason: null, created_at: null, resolved_at: null, spot, ...overrides,
  }
}

beforeEach(() => {
  posts = []
  mine = [
    contribution({ id: 1, status: "pending", title: "Sector Norte" }),
    contribution({ id: 2, status: "approved", kind: "climbing_route", title: "La Diagonal" }),
    contribution({ id: 3, status: "rejected", kind: "experience", title: "Pesca", reject_reason: "No es del lugar" }),
  ]
})

describe("MyContributionsCard", () => {
  it("muestra cada aporte con su estado y el motivo del rechazo", async () => {
    render(<MyContributionsCard token="t" />)
    expect(await screen.findByText("Tus aportes")).toBeTruthy()
    expect(screen.getByText("En revisión")).toBeTruthy()
    expect(screen.getByText("Aprobado")).toBeTruthy()
    expect(screen.getByText("Rechazado")).toBeTruthy()
    expect(screen.getByText("Motivo: No es del lugar")).toBeTruthy()
    expect(screen.getAllByRole("link", { name: "Cerro Arequita" })[0].getAttribute("href")).toBe("/spots/cerro-arequita")
  })

  it("sin aportes se muestra igual, explicando qué son", async () => {
    mine = []
    render(<MyContributionsCard token="t" />)
    expect(await screen.findByText(/Cuando sumes algo a un lugar ya publicado/)).toBeTruthy()
    expect(screen.getByRole("link", { name: "＋ Sumar algo" }).getAttribute("href")).toBe("/agregar-lugar")
  })

  it("retirar un aporte pendiente pide confirmación", async () => {
    render(<MyContributionsCard token="t" />)
    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }))
    expect(screen.getByText("¿Retirar este aporte?")).toBeTruthy()
    fireEvent.click(screen.getAllByRole("button", { name: "Retirar" }).at(-1)!)
    await waitFor(() => expect(posts).toEqual(["/contributions/1/withdraw"]))
    await waitFor(() => expect(screen.queryByText("Sector Norte")).toBeNull())
  })

  it("cerrar el aviso de uno resuelto", async () => {
    render(<MyContributionsCard token="t" />)
    fireEvent.click(await screen.findByRole("button", { name: "Cerrar aviso de Pesca" }))
    await waitFor(() => expect(posts).toEqual(["/contributions/3/dismiss"]))
    await waitFor(() => expect(screen.queryByText("Pesca")).toBeNull())
  })
})
