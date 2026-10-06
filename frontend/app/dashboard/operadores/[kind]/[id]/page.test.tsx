import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { Operator } from "./operator"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let operator: Operator
let patchResponse = { applied: [] as string[], pending: [] as string[] }
let patches: { url: string; body: unknown; dry: boolean }[] = []
let posts: string[] = []
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { status = 0 },
  api: {
    get: () => Promise.resolve({ data: operator }),
    patch: (url: string, body: unknown, opts: { params?: { dry_run?: boolean } }) => {
      patches.push({ url, body, dry: !!opts?.params?.dry_run })
      return Promise.resolve({ data: patchResponse })
    },
    post: (url: string) => { posts.push(url); return Promise.resolve({ data: {} }) },
  },
}))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { id_token: "t" }, status: "authenticated" }) }))
vi.mock("next/navigation", () => ({
  useParams: () => ({ kind: "surf_school", id: "1" }),
  useRouter: () => ({ push: () => {} }),
}))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))

const { default: OperatorDashboardPage } = await import("./page")

function school(overrides: Partial<Operator> = {}): Operator {
  return {
    id: 1, kind: "surf_school", name: "Escuela Ola", is_approved: true,
    spot: { id: 3, name: "Playa Brava", slug: "playa-brava", is_approved: true },
    contribution_id: null, change_request: null,
    photo_1: null, photo_2: null, photo_3: null,
    duration: null, email: null, whatsapp: "099", instagram: null, season_start: null, season_end: null,
    class_type: "grupal", equipment_include: null,
    ...overrides,
  }
}

afterEach(() => {
  patches = []
  posts = []
  patchResponse = { applied: [], pending: [] }
})

describe("Dashboard de escuela", () => {
  it("muestra la escuela con su playa", async () => {
    operator = school()
    render(<OperatorDashboardPage />)
    expect(await screen.findByRole("heading", { name: "Escuela Ola" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Playa Brava" }).getAttribute("href")).toBe("/spots/playa-brava")
    expect(screen.getByText("Tipo de clase")).toBeTruthy()
  })

  it("cambiar el nombre avisa que pasa a revisión antes de guardar", async () => {
    operator = school()
    patchResponse = { applied: [], pending: ["name"] }
    render(<OperatorDashboardPage />)
    const input = await screen.findByDisplayValue("Escuela Ola")
    fireEvent.change(input, { target: { value: "Ola Nueva" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))
    expect(await screen.findByText("Algunos cambios pasan a revisión")).toBeTruthy()
    expect(patches).toEqual([{ url: "/operators/surf_school/1", body: expect.objectContaining({ name: "Ola Nueva" }), dry: true }])
  })

  it("lo instantáneo se guarda sin aviso", async () => {
    operator = school()
    patchResponse = { applied: ["whatsapp"], pending: [] }
    render(<OperatorDashboardPage />)
    fireEvent.change(await screen.findByDisplayValue("099"), { target: { value: "098" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))
    expect(await screen.findByText("✓ Guardado correctamente")).toBeTruthy()
    expect(patches.map(p => p.dry)).toEqual([true, false])
  })

  it("con un pedido pendiente, el nombre queda bloqueado y se puede cancelar", async () => {
    operator = school({
      change_request: {
        id: 5, status: "pending", reject_reason: null, created_at: null, resolved_at: null,
        changes: { name: { from: "Escuela Ola", to: "Ola Nueva" } },
      },
    })
    render(<OperatorDashboardPage />)
    expect(((await screen.findByDisplayValue("Escuela Ola")) as HTMLInputElement).disabled).toBe(true)
    expect(screen.getByText("⏳ En revisión: «Ola Nueva»")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Cancelar cambio" }))
    fireEvent.click(screen.getAllByRole("button", { name: "Cancelar cambio" }).at(-1)!)
    await waitFor(() => expect(posts).toEqual(["/operators/surf_school/1/change-request/cancel"]))
  })
})
