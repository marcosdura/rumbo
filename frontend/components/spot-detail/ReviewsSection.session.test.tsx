import { describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

// La sesión llega un momento después de abrir la página: las reseñas se
// vuelven a pedir con ella (si no, no se sabe cuál es la tuya).
let session: { id_token: string } | null = null
const asked: (string | undefined)[] = []

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session }) }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => null }))
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
})
