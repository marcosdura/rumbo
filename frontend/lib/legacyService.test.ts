import { beforeEach, describe, expect, it, vi } from "vitest"

const calls: string[] = []
let reply: () => Promise<unknown>
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("404") },
  permanentRedirect: (to: string) => { throw new Error(`308 ${to}`) },
}))
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { constructor(public status: number, m: string) { super(m) } },
  api: { get: (url: string) => { calls.push(url); return reply() } },
}))

const { ApiError } = await import("@/lib/api")
const { redirectToSpot } = await import("./legacyService")
const { default: OldSurfPage } = await import("@/app/surf/[slug]/page")
const { default: OldKayakPage } = await import("@/app/kayak/[slug]/page")

beforeEach(() => { calls.length = 0 })

describe("Direcciones viejas de escuelas y kayaks", () => {
  it("la escuela lleva a su lugar", async () => {
    reply = async () => ({ data: { slug: "escuela-ola" } })
    await expect(OldSurfPage({ params: Promise.resolve({ slug: "escuela-ola-7" }) })).rejects.toThrow("308 /spots/escuela-ola")
    expect(calls).toEqual(["/spots/legacy/surf/7"])
  })

  it("el kayak pregunta por kayak", async () => {
    reply = async () => ({ data: { slug: "kayak-sur" } })
    await expect(OldKayakPage({ params: Promise.resolve({ slug: "kayak-sur-9" }) })).rejects.toThrow("308 /spots/kayak-sur")
    expect(calls).toEqual(["/spots/legacy/kayak/9"])
  })

  it("sin id en la dirección, 404 sin llamar a la API", async () => {
    await expect(redirectToSpot("surf", "sin-numero")).rejects.toThrow("404")
    expect(calls).toEqual([])
  })

  it("si el lugar no existe, 404", async () => {
    reply = async () => { throw new ApiError(404, "No encontrado") }
    await expect(redirectToSpot("surf", "x-3")).rejects.toThrow("404")
  })

  it("si falló la API, el error sigue (no es un 404)", async () => {
    reply = async () => { throw new ApiError(500, "caído") }
    await expect(redirectToSpot("kayak", "x-3")).rejects.toThrow("caído")
  })
})
