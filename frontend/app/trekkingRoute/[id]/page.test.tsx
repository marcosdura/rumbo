import { afterEach, describe, expect, it, vi } from "vitest"

// La dirección vieja lleva a la ruta dentro de su lugar.
let route: unknown = null
let down = false
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("404") },
  permanentRedirect: (url: string) => { throw new Error(`redirect:${url}`) },
}))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async () => {
      const { ApiError } = await import("@/lib/api")
      if (down) throw new ApiError(503, "caído")
      if (!route) throw new ApiError(404, "No encontrado")
      return { data: route }
    },
  },
}))

const { default: LegacyPage } = await import("./page")
const params = Promise.resolve({ id: "4" })

afterEach(() => { route = null; down = false })

describe("/trekkingRoute/{id}", () => {
  it("redirige a /spots/{lugar}/rutas/{ruta}", async () => {
    route = { slug: "cumbre", spot_slug: "arequita" }
    await expect(LegacyPage({ params })).rejects.toThrow("redirect:/spots/arequita/rutas/cumbre")
  })

  it("si no existe, 404", async () => {
    await expect(LegacyPage({ params })).rejects.toThrow("404")
  })

  it("si la API falla no dice que no existe", async () => {
    down = true
    await expect(LegacyPage({ params })).rejects.toThrow("caído")
  })
})
