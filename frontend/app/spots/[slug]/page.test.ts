import { describe, expect, it, vi } from "vitest"

// La página pide el lugar al backend: simulado con un valor común.
let fail: number | null = null
const cabo = {
  name: "Cabo Polonio", description: "Faro y lobos marinos", department: "Rocha", categories: [{ name: "Camping" }],
  images: [{ cloudinary_public_id: "rumbo/spots/9/otra", is_main: false }, { cloudinary_public_id: "rumbo/spots/9/principal", is_main: true }],
}
let spotData: Record<string, unknown> = cabo
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404") } }))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: {
    get: async () => {
      const { ApiError } = await import("@/lib/api")
      if (fail) throw new ApiError(fail, fail === 404 ? "No encontrado" : "caído")
      return { data: spotData }
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

// cache() de React guarda el pedido por slug: cada test, su slug.
const meta = (slug: string, data: Record<string, unknown>) => { spotData = data; return generateMetadata({ params: Promise.resolve({ slug }) }) }

describe("SEO del lugar", () => {
  it("canónica y og:url con su dirección", async () => {
    const m = await meta("cabo-1", cabo)
    expect(m.alternates?.canonical).toBe("/spots/cabo-1")
    expect(m.openGraph?.url).toBe("/spots/cabo-1")
  })

  it("título sin espacios de más y descripción cortada en una palabra", async () => {
    const long = "Spot de surf urbano a pocos metros de la Península de Punta del Este. Las rocas cercanas generan rompientes interesantes que lo hacen uno de los puntos más frecuentados."
    const m = await meta("emir", { ...cabo, name: "Playa El Emir ", description: long })
    expect(m.title).toBe("Playa El Emir — Rocha | Rumbo")
    expect(String(m.description).endsWith("…")).toBe(true)
    expect(String(m.description).length).toBeLessThanOrEqual(160)
  })

  it("sin descripción, una armada; sin fotos, la imagen de Rumbo", async () => {
    const m = await meta("playa-sur", { ...cabo, name: "Playa Sur", description: null, categories: [{ name: "Surf" }], images: [] })
    expect(m.description).toBe("Playa Sur: Surf en Rocha. Información práctica, fotos y reseñas en Rumbo.")
    expect((m.openGraph?.images as { url: string }[])[0].url).toBe("/opengraph-image")
  })

  it("los datos estructurados incluyen las migas de pan", async () => {
    spotData = cabo
    const { renderToStaticMarkup } = await import("react-dom/server")
    const html = renderToStaticMarkup(await SpotPage({ params: Promise.resolve({ slug: "cabo-2" }) }))
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1])
    expect(ld.map((x: { "@type": string }) => x["@type"])).toEqual(["Place", "BreadcrumbList"])
    expect(ld[1].itemListElement[1].item).toBe("https://rumboapp.uy/spots/cabo-2")
  })

  it("una escuela de surf es un negocio para Google (SportsActivityLocation)", async () => {
    spotData = { ...cabo, surf_detail: { class_type: "grupal" } }
    const { renderToStaticMarkup } = await import("react-dom/server")
    const html = renderToStaticMarkup(await SpotPage({ params: Promise.resolve({ slug: "escuela-1" }) }))
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1])
    expect(ld[0]["@type"]).toBe("SportsActivityLocation")
  })
})
