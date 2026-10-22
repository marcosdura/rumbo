import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let fail = false
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }))
vi.mock("@/components/layout/AuthModal", () => ({ default: () => null }))
vi.mock("@/components/ui/ReportButton", () => ({ default: () => null }))
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }))
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => fail
      ? Promise.reject(new Error("red"))
      : Promise.resolve(url.endsWith("/summary")
        ? { data: { average: null, count: 0 } }
        : { data: [], totalCount: 0 }),
  },
}))

const { default: ReviewsSection } = await import("./ReviewsSection")

afterEach(() => { fail = false })

const flush = () => act(() => Promise.resolve())

describe("ReviewsSection", () => {
  it("si no cargan, avisa; al reintentar bien, el aviso se va", async () => {
    fail = true
    render(<ReviewsSection spotId={12} />)
    await flush()
    expect(screen.getByText("No se pudieron cargar las reseñas.")).toBeTruthy()

    fail = false
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(screen.getByText("Cargando...")).toBeTruthy()
    await flush()
    expect(screen.queryByText("No se pudieron cargar las reseñas.")).toBeNull()
    expect(screen.getByText("💬 Todavía no hay reseñas. ¡Escribí la primera!")).toBeTruthy()
  })

  it("si el reintento también falla, el aviso sigue", async () => {
    fail = true
    render(<ReviewsSection spotId={12} />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    await flush()
    expect(screen.getByText("No se pudieron cargar las reseñas.")).toBeTruthy()
  })

  it("dice reseña, como el resto del sitio (antes mezclaba 'review')", async () => {
    const { container } = render(<ReviewsSection spotId={12} />)
    await flush()
    expect(screen.getByText("Reseñas")).toBeTruthy()
    expect(screen.getByRole("button", { name: "✏️ Escribir una reseña" })).toBeTruthy()
    // Lo que se lee (sin el <style>, que tiene clases como .reviews-wrap).
    const visible = [...container.querySelectorAll("*:not(style)")].flatMap(el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent)).join(" ")
    expect(visible.match(/.{0,40}review.{0,40}/i)?.[0] ?? null).toBeNull()
  })
})
