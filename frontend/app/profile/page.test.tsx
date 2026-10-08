import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { EMPTY_SUMMARY } from "@/lib/profile"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let session: { id_token: string; user: { name: string; email: string } } = { id_token: "t1", user: { name: "Ana", email: "ana@test.com" } }
let tokens: string[] = []
let fail: "401" | "500" | null = null
let signedOut = 0
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: "authenticated" }),
  signOut: () => { signedOut++ },
  getSession: () => Promise.resolve(session),
}))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => <p>pantalla de carga</p> }))
vi.mock("./DeleteAccountModal", () => ({ default: () => null }))
vi.mock("@/lib/api", () => {
  class ApiError extends Error { constructor(public status: number) { super("x") } }
  return {
    ApiError,
    api: {
      get: (_url: string, opts: { token: string }) => {
        tokens.push(opts.token)
        if (fail) return Promise.reject(new ApiError(fail === "401" ? 401 : 500))
        return Promise.resolve({ data: { ...EMPTY_SUMMARY, member_since: "2025-03-14T10:00:00", favorites: 8, reviews: 2 } })
      },
    },
  }
})

const { default: ProfilePage } = await import("./page")

afterEach(() => {
  session = { id_token: "t1", user: { name: "Ana", email: "ana@test.com" } }
  tokens = []
  fail = null
  signedOut = 0
})

const flush = () => act(() => Promise.resolve())

describe("Perfil", () => {
  it("arriba: quién sos, desde cuándo y un resumen corto", async () => {
    render(<ProfilePage />)
    await flush()
    expect(screen.getByText("Ana")).toBeTruthy()
    expect(screen.getByText(/Miembro desde marzo de 2025/)).toBeTruthy()
    expect(screen.getByText("8 favoritos · 2 reseñas")).toBeTruthy()
  })

  it("debajo, el menú con las secciones; y al final cerrar sesión", async () => {
    render(<ProfilePage />)
    await flush()
    const menu = screen.getByRole("navigation", { name: "Secciones del perfil" })
    const links = Array.from(menu.querySelectorAll("a")).map(a => a.getAttribute("href"))
    expect(links).toEqual(["/favorites", "/reviews", "/profile/lugares", "/profile/aportes", "/profile/pedidos"])
    expect(screen.getByRole("button", { name: /Cerrar sesión/ })).toBeTruthy()
  })

  it("si el token se renueva, recarga sin volver a la pantalla de carga", async () => {
    const { rerender } = render(<ProfilePage />)
    await flush()
    session = { ...session, id_token: "t2" }
    rerender(<ProfilePage />)
    expect(screen.queryByText("pantalla de carga")).toBeNull()
    await flush()
    expect(tokens).toEqual(["t1", "t2"])
  })

  it("si el resumen falla, el menú se muestra igual", async () => {
    fail = "500"
    render(<ProfilePage />)
    await flush()
    await flush()
    expect(screen.getByRole("navigation", { name: "Secciones del perfil" })).toBeTruthy()
    expect(signedOut).toBe(0)
  })

  it("con la sesión vencida (401 aun después de renovar), cierra la sesión", async () => {
    fail = "401"
    render(<ProfilePage />)
    await flush()
    await flush()
    await flush()
    expect(signedOut).toBe(1)
  })
})
