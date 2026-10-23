import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { savePendingAction } from "@/lib/pendingAction"

// La sesión llega un momento después de abrir la página: las reseñas se
// vuelven a pedir con ella (si no, no se sabe cuál es la tuya).
let session: { id_token: string } | null = null
const asked: (string | undefined)[] = []

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
let authPending: unknown = null
vi.mock("@/components/layout/AuthModal", () => ({ default: (p: { pending?: unknown }) => { authPending = p.pending; return null } }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }))
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string, opts: { token?: string }) => {
      if (url.endsWith("/summary")) {
        asked.push(opts.token)
        return Promise.resolve({ data: { average: 5, total: 1, my_review: opts.token ? { id: 1, rating: 5, comment: "" } : null } })
      }
      return Promise.resolve({ data: [], totalCount: 0 })
    },
  },
}))

const { default: ReviewsSection } = await import("./ReviewsSection")
const flush = () => act(() => new Promise(r => setTimeout(r, 0)))

describe("reseñas y la sesión", () => {
  it("cuando llega la sesión, vuelve a pedirlas y ofrece editar la tuya", async () => {
    const { rerender } = render(<ReviewsSection spotId={12} />)
    await flush()
    expect(screen.getByRole("button", { name: "✏️ Escribir una reseña" })).toBeTruthy()

    session = { id_token: "tok" }
    rerender(<ReviewsSection spotId={12} />)
    await flush()
    expect(asked).toEqual([undefined, "tok"])
    expect(screen.getByRole("button", { name: "✏️ Editar mi reseña" })).toBeTruthy()
  })

  it("si tocó «Escribir una reseña» sin sesión, al volver del login se abre el formulario", async () => {
    session = { id_token: "tok" }
    savePendingAction({ kind: "review", spotId: 30 })
    // En este mock ya tiene reseña: se abre la suya para editar.
    render(<ReviewsSection spotId={30} />)
    await flush()
    expect(screen.queryByRole("button", { name: /Escribir una reseña|Editar mi reseña/ })).toBeNull()
    expect(screen.getByRole("textbox")).toBeTruthy()
    expect(sessionStorage.getItem("rumbo_pending_action")).toBeNull()
  })

  it("la de otro lugar no abre nada acá", async () => {
    session = { id_token: "tok" }
    savePendingAction({ kind: "review", spotId: 99 })
    render(<ReviewsSection spotId={31} />)
    await flush()
    expect(screen.getByRole("button", { name: /Editar mi reseña|Escribir una reseña/ })).toBeTruthy()
    expect(screen.queryByRole("textbox")).toBeNull()
    sessionStorage.clear()
  })

  it("sin sesión, el login recuerda que quería reseñar este lugar", async () => {
    session = null
    render(<ReviewsSection spotId={44} />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "✏️ Escribir una reseña" }))
    expect(authPending).toEqual({ kind: "review", spotId: 44 })
  })
})
