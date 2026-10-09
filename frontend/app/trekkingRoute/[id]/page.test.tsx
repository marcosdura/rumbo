import { afterEach, describe, expect, it, vi } from "vitest"

// La dirección vieja lleva a la ruta dentro de su lugar.
let route: unknown = null
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("404") },
  permanentRedirect: (url: string) => { throw new Error(`redirect:${url}`) },
}))
vi.mock("@/lib/api", () => ({
  api: { get: () => (route ? Promise.resolve({ data: route }) : Promise.reject(new Error("404"))) },
}))

const { default: LegacyPage } = await import("./page")
const params = Promise.resolve({ id: "4" })

afterEach(() => { route = null })

describe("/trekkingRoute/{id}", () => {
  it("redirige a /spots/{lugar}/rutas/{ruta}", async () => {
    route = { slug: "cumbre", spot_slug: "arequita" }
    await expect(LegacyPage({ params })).rejects.toThrow("redirect:/spots/arequita/rutas/cumbre")
  })

  it("si no existe, 404", async () => {
    await expect(LegacyPage({ params })).rejects.toThrow("404")
  })
})
