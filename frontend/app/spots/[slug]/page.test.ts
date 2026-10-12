import { describe, expect, it, vi } from "vitest"

// La página pide el lugar al backend: simulado con un valor común.
let fail: number | null = null
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async () => {
      const { ApiError } = await import("@/lib/api")
      if (fail) throw new ApiError(fail, fail === 404 ? "No encontrado" : "caído")
      return { data: {
      name: "Cabo Polonio", description: "Faro y lobos marinos",
      images: [{ cloudinary_public_id: "rumbo/spots/9/otra", is_main: false }, { cloudinary_public_id: "rumbo/spots/9/principal", is_main: true }],
    } }
    },
  },
}))
vi.mock("./SpotDetails", () => ({ default: () => null }))

const { default: SpotPage, generateMetadata } = await import("./page")

describe("Metadatos al compartir el lugar", () => {
  it("usan la foto principal recortada a 1200×630", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "cabo-polonio" }) })
    const og = (meta.openGraph?.images as { url: string; width: number; height: number }[])[0]
    expect(og.url).toMatch(/\/image\/upload\/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg\/rumbo\/spots\/9\/principal$/)
    expect([og.width, og.height]).toEqual([1200, 630])
  })
})

describe("Si no existe o si falló la API", () => {
  // Cada test con su slug: cache() de React guarda el pedido por slug.
  it("si no existe, 404", async () => {
    fail = 404
    await expect(SpotPage({ params: Promise.resolve({ slug: "no-existe" }) })).rejects.toThrow("404")
    fail = null
  })

  it("si la API falla no dice que no existe: el error sigue hasta la pantalla de error", async () => {
    fail = 503
    await expect(SpotPage({ params: Promise.resolve({ slug: "caido" }) })).rejects.toThrow("caído")
    fail = null
  })
})
