import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

let session: { id_token: string; user: { name: string } } = { id_token: "t1", user: { name: "Ana" } }
let tokens: string[] = []
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: "authenticated" }),
  signOut: () => {},
  getSession: () => Promise.resolve(session),
}))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => <p>pantalla de carga</p> }))
vi.mock("./ProfileInfoCard", () => ({ default: () => <p>perfil</p> }))
for (const card of ["./AccountActions", "./StatsRow", "./MySpotsCard", "./MyContributionsCard", "./MyOperatorsCard", "./FavoritesPreview", "./DeleteAccountModal"]) {
  vi.doMock(card, () => ({ default: () => null }))
}
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  api: { get: (_url: string, opts: { token: string }) => { tokens.push(opts.token); return Promise.resolve({ data: [] }) } },
}))

const { default: ProfilePage } = await import("./page")

afterEach(() => {
  session = { id_token: "t1", user: { name: "Ana" } }
  tokens = []
})

const flush = () => act(() => Promise.resolve())

describe("Perfil", () => {
  it("carga una vez y muestra el perfil", async () => {
    render(<ProfilePage />)
    expect(screen.getByText("pantalla de carga")).toBeTruthy()
    await flush()
    expect(screen.getByText("perfil")).toBeTruthy()
    expect(tokens).toEqual(["t1", "t1", "t1"])
  })

  it("si el token se renueva, recarga sin volver a la pantalla de carga", async () => {
    const { rerender } = render(<ProfilePage />)
    await flush()
    session = { id_token: "t2", user: { name: "Ana" } }
    rerender(<ProfilePage />)
    expect(screen.queryByText("pantalla de carga")).toBeNull()
    expect(screen.getByText("perfil")).toBeTruthy()
    await flush()
    expect(tokens.slice(3)).toEqual(["t2", "t2", "t2"])
  })
})
