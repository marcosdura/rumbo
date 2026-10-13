import { afterEach, describe, expect, it, vi } from "vitest"

// API simulada: lo que devuelve cada lista (o null = falla).
let lists: Record<string, unknown[] | null> = {}
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => (lists[url] === null ? Promise.reject(new Error("caído")) : Promise.resolve({ data: lists[url] ?? [] })),
  },
}))

const { default: robots } = await import("./robots")
const { default: sitemap } = await import("./sitemap")
const urls = async () => (await sitemap()).map(e => e.url)

afterEach(() => { lists = {} })

describe("robots y sitemap", () => {
  it("apuntan a rumboapp.uy (antes a rumbo-eight.vercel.app, que es otra app)", async () => {
    expect(robots().sitemap).toBe("https://rumboapp.uy/sitemap.xml")
    for (const url of await urls()) expect(url.startsWith("https://rumboapp.uy/")).toBe(true)
  })

  it("incluye legal y no las páginas privadas (antes /agregar-lugar, que robots.txt bloquea)", async () => {
    const all = await urls()
    expect(all).toContain("https://rumboapp.uy/legal")
    expect(all.some(u => u.includes("/agregar-lugar"))).toBe(false)
  })

  it("incluye los lugares (también escuelas y kayaks), las rutas y los sectores (antes no estaban)", async () => {
    lists = {
      "/spots/ids": [{ id: 1, slug: "cerro" }, { id: 4, slug: "escuela-ola" }],
      "/sitemap/trails": [{ kind: "rutas", spot_slug: "cerro", slug: "cumbre" }, { kind: "sectores", spot_slug: "roca", slug: "norte" }],
    }
    expect(await urls()).toEqual(expect.arrayContaining([
      "https://rumboapp.uy/spots/cerro",
      "https://rumboapp.uy/spots/cerro/rutas/cumbre",
      "https://rumboapp.uy/spots/roca/sectores/norte",
      "https://rumboapp.uy/spots/escuela-ola",
    ]))
    // Las direcciones viejas de escuelas y kayaks ya no van (redirigen).
    expect((await urls()).some(u => u.includes("/surf/") || u.includes("/kayak/"))).toBe(false)
  })

  it("incluye las páginas /lugares con lugares, y no la búsqueda (Google no la indexa)", async () => {
    lists = { "/sitemap/places": [{ activity: "Camping", department: "Rocha", count: 2 }] }
    const all = await urls()
    expect(all).toEqual(expect.arrayContaining([
      "https://rumboapp.uy/lugares/camping",
      "https://rumboapp.uy/lugares/surf",
      "https://rumboapp.uy/lugares/rocha",
      "https://rumboapp.uy/lugares/camping/rocha",
    ]))
    expect(all).not.toContain("https://rumboapp.uy/lugares/surf/rocha")
    expect(all.some(u => u.includes("/search"))).toBe(false)
  })

  it("si falla la lista de /lugares, igual van las páginas de cada actividad", async () => {
    lists = { "/sitemap/places": null }
    expect(await urls()).toContain("https://rumboapp.uy/lugares/kayak")
  })

  it("si una lista falla, el resto sale igual", async () => {
    lists = { "/spots/ids": [{ id: 1, slug: "cerro" }], "/sitemap/trails": null }
    expect(await urls()).toContain("https://rumboapp.uy/spots/cerro")
  })
})
