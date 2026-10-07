import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

let sessionState: { data: unknown; status: string } = { data: null, status: "unauthenticated" }
let requests: string[] = []
vi.mock("next-auth/react", () => ({ useSession: () => sessionState }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => <p>pantalla de carga</p> }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => { requests.push(url); return Promise.resolve({ data: [] }) } },
}))

const { default: MyReviewsPage } = await import("./page")

afterEach(() => {
  sessionState = { data: null, status: "unauthenticated" }
  requests = []
})

describe("Mis reviews", () => {
  it("sin sesión pide iniciarla, sin quedarse cargando ni pedir nada", () => {
    render(<MyReviewsPage />)
    expect(screen.getByText("Iniciá sesión para ver tus reviews")).toBeTruthy()
    expect(screen.queryByText("pantalla de carga")).toBeNull()
    expect(requests).toEqual([])
  })

  it("con sesión carga y después muestra las reviews", async () => {
    sessionState = { data: { id_token: "t", user: { name: "Ana" } }, status: "authenticated" }
    render(<MyReviewsPage />)
    expect(screen.getByText("pantalla de carga")).toBeTruthy()
    await act(() => Promise.resolve())
    expect(requests).toEqual(["/reviews/user/me"])
    expect(screen.getByText(/Todavía no escribiste reviews/)).toBeTruthy()
  })
})
