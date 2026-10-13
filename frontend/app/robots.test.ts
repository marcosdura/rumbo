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

  it("incluye los lugares, las rutas y los sectores (antes no estaban), las escuelas y los kayaks", async () => {
    lists = {
      "/spots/ids": [{ id: 1, slug: "cerro" }],
      "/sitemap/trails": [{ kind: "rutas", spot_slug: "cerro", slug: "cumbre" }, { kind: "sectores", spot_slug: "roca", slug: "norte" }],
      "/surfschool/ids": [{ id: 4, name: "Escuela Ola" }],
      "/kayak/ids": [{ id: 7, name: "Kayak Sur" }],
    }
    expect(await urls()).toEqual(expect.arrayContaining([
      "https://rumboapp.uy/spots/cerro",
      "https://rumboapp.uy/spots/cerro/rutas/cumbre",
      "https://rumboapp.uy/spots/roca/sectores/norte",
      "https://rumboapp.uy/surf/escuela-ola-4",
      "https://rumboapp.uy/kayak/kayak-sur-7",
    ]))
  })

  it("si una lista falla, el resto sale igual", async () => {
    lists = { "/spots/ids": [{ id: 1, slug: "cerro" }], "/sitemap/trails": null }
    expect(await urls()).toContain("https://rumboapp.uy/spots/cerro")
  })
})
