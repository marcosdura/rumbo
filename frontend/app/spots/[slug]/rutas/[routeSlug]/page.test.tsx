import { afterEach, describe, expect, it, vi } from "vitest"

let route: unknown = null
vi.mock("../../../../trekkingRoute/[id]/TrekkingRouteDetails", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: () => (route ? Promise.resolve({ data: route }) : Promise.reject(new Error("404"))) },
}))

const { generateMetadata } = await import("./page")
const params = Promise.resolve({ slug: "arequita", routeSlug: "cumbre" })

afterEach(() => { route = null })

describe("metadata de la ruta", () => {
  it("con los datos de la ruta", async () => {
    route = { name: "Cumbre", distance_km: 4, duration_hours: 1.5, difficulty: "moderado" }
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("Cumbre | Rumbo")
    expect(meta.description).toBe("Ruta de trekking: 4 km, 1.5 h, dificultad moderado.")
  })

  it("si no existe, sin undefined en la descripción", async () => {
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("cumbre | Rumbo")
    expect(meta.description).toBe("Ruta de trekking en Uruguay.")
  })
})
