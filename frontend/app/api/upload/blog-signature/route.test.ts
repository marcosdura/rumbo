import { afterEach, describe, expect, it, vi } from "vitest"

// Que sea admin lo decide el backend: acá se simula su respuesta.
let admin = true
vi.mock("@/lib/adminSession", () => ({ isAdminSession: async () => admin }))

const { POST } = await import("./route")
const post = (body: unknown) => POST(new Request("http://x/api/upload/blog-signature", { method: "POST", body: JSON.stringify(body) }))

afterEach(() => { admin = true })

describe("firma de fotos del blog", () => {
  it("el admin firma en rumbo/blog, sin pisar archivos", async () => {
    const res = await post({ publicId: "0123456789abcdef" })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ folder: "rumbo/blog", overwrite: "false" })
  })

  it("nadie más", async () => {
    admin = false
    expect((await post({ publicId: "0123456789abcdef" })).status).toBe(403)
  })

  it("un id elegido a mano no se firma", async () => {
    expect((await post({ publicId: "../spots/42/abc" })).status).toBe(400)
    expect((await post({})).status).toBe(400)
  })
})
