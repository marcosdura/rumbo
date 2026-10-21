import { afterEach, describe, expect, it, vi } from "vitest"

// Sesión y backend simulados: lo que contesta can-upload decide la respuesta.
let session: unknown = { user: { email: "ana@test.com" }, id_token: "tok" }
let canUpload: () => Promise<unknown> = async () => ({ data: { ok: true } })
vi.mock("next-auth", () => ({ getServerSession: async () => session }))
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }))
vi.mock("@/lib/api", async () => {
  const real = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return { ...real, api: { get: () => canUpload() } }
})

const { POST } = await import("./route")
const { ApiError } = await import("@/lib/api")
const post = () => POST(new Request("http://x/api/upload/signature", { method: "POST", body: JSON.stringify({ publicId: "42/0123456789abcdef", spotId: 42 }) }))

afterEach(() => {
  session = { user: { email: "ana@test.com" }, id_token: "tok" }
  canUpload = async () => ({ data: { ok: true } })
})

describe("firma de subida a Cloudinary", () => {
  it("con permiso, firma con overwrite=false y los formatos permitidos", async () => {
    const res = await post()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ folder: "rumbo/spots", overwrite: "false" })
    expect(body.signature).toMatch(/^[0-9a-f]{40}$/)
  })

  it("sin sesión, 401", async () => {
    session = null
    expect((await post()).status).toBe(401)
  })

  it("si el backend dice que llegó al tope de fotos, lo dice tal cual (429)", async () => {
    canUpload = async () => { throw new ApiError(429, "Llegaste al máximo de fotos por hoy. Probá de nuevo mañana.") }
    const res = await post()
    expect(res.status).toBe(429)
    expect((await res.json()).error).toBe("Llegaste al máximo de fotos por hoy. Probá de nuevo mañana.")
  })

  it("cualquier otro rechazo del backend, 403", async () => {
    canUpload = async () => { throw new ApiError(403, "No autorizado") }
    expect((await post()).status).toBe(403)
  })
})
