import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api", () => ({ api: { get: () => Promise.resolve({ data: [] }) } }))

const { default: robots } = await import("./robots")
const { default: sitemap } = await import("./sitemap")

describe("robots y sitemap", () => {
  it("apuntan a rumboapp.uy (antes a rumbo-eight.vercel.app, que es otra app)", async () => {
    expect(robots().sitemap).toBe("https://rumboapp.uy/sitemap.xml")
    const urls = (await sitemap()).map(e => e.url)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) expect(url.startsWith("https://rumboapp.uy/")).toBe(true)
  })
})
