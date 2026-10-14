import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

let session: { id_token: string } | null = { id_token: "t" }
let status = "authenticated"
let reply: () => Promise<unknown>
const calls: { url: string; token?: string }[] = []
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "7" }) }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: session, status }) }))
vi.mock("@/app/spots/[slug]/SpotDetails", () => ({
  default: ({ spot, preview }: { spot: { name: string }; preview?: boolean }) => <h1 data-preview={String(!!preview)}>{spot.name}</h1>,
}))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/layout/Footer", () => ({ default: () => null }))
vi.mock("@/components/layout/LoginRequired", () => ({ default: () => <p>Iniciá sesión</p> }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => <p>Cargando</p> }))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: { get: (url: string, o: { token?: string }) => { calls.push({ url, token: o.token }); return reply() } },
}))

const { ApiError } = await import("@/lib/api")
const { default: SpotPreviewPage } = await import("./page")

afterEach(() => { session = { id_token: "t" }; status = "authenticated"; calls.length = 0 })

describe("Vista previa de un lugar", () => {
  it("pide la vista previa con la sesión y muestra el lugar en modo vista previa", async () => {
    reply = async () => ({ data: { id: 7, name: "Camping Nuevo" } })
    render(<SpotPreviewPage />)
    await act(() => Promise.resolve())
    expect(calls).toEqual([{ url: "/spots/7/preview", token: "t" }])
    expect(screen.getByRole("heading", { name: "Camping Nuevo" }).getAttribute("data-preview")).toBe("true")
  })

  it("sin permiso o si no existe, lo dice", async () => {
    reply = async () => { throw new ApiError(403, "No autorizado") }
    render(<SpotPreviewPage />)
    await act(() => Promise.resolve())
    expect(screen.getByText(/No encontramos este lugar, o no tenés permiso/)).toBeTruthy()
  })

  it("sin sesión pide iniciarla", () => {
    session = null; status = "unauthenticated"
    render(<SpotPreviewPage />)
    expect(screen.getByText("Iniciá sesión")).toBeTruthy()
    expect(calls).toEqual([])
  })
})
