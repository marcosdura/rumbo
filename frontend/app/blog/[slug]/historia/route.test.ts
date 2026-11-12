// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

// Una nota que no existe o es un borrador: el backend da 404.
vi.mock("@/lib/api", async () => {
  const real = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return { ...real, api: { get: async () => { throw new real.ApiError(404, "Nota no encontrada") } } }
})

const { GET } = await import("./route")

describe("la imagen para historias", () => {
  it("de una nota que no está publicada, 404", async () => {
    const res = await GET(new Request("http://x/blog/borrador/historia"), { params: Promise.resolve({ slug: "borrador" }) })
    expect(res.status).toBe(404)
  })
})
