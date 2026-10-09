import { describe, expect, it, vi } from "vitest"

// La página pide el lugar al backend: simulado con un valor común.
vi.mock("@/lib/api", () => ({
  api: {
    get: () => Promise.resolve({ data: {
      name: "Cabo Polonio", description: "Faro y lobos marinos",
      images: [{ cloudinary_public_id: "rumbo/spots/9/otra", is_main: false }, { cloudinary_public_id: "rumbo/spots/9/principal", is_main: true }],
    } }),
  },
}))
vi.mock("./SpotDetails", () => ({ default: () => null }))

const { generateMetadata } = await import("./page")

describe("Metadatos al compartir el lugar", () => {
  it("usan la foto principal recortada a 1200×630", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "cabo-polonio" }) })
    const og = (meta.openGraph?.images as { url: string; width: number; height: number }[])[0]
    expect(og.url).toMatch(/\/image\/upload\/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg\/rumbo\/spots\/9\/principal$/)
    expect([og.width, og.height]).toEqual([1200, 630])
  })
})
