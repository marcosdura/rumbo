import { afterEach, describe, expect, it, vi } from "vitest"

let sector: unknown = null
vi.mock("../../../../../components/spot-detail/ClimbingSectorDetails", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: { get: () => (sector ? Promise.resolve({ data: sector }) : Promise.reject(new Error("404"))) },
}))

const { generateMetadata } = await import("./page")
const params = Promise.resolve({ slug: "arequita", sectorSlug: "norte" })

afterEach(() => { sector = null })

describe("metadata del sector", () => {
  it("cuenta las vías con routes_count", async () => {
    sector = { name: "Norte", routes_count: 8, min_grade: "5b", max_grade: "6c" }
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("Norte | Rumbo")
    expect(meta.description).toBe("Sector de escalada: 8 vías, graduación 5b–6c.")
  })

  it("si no existe, usa el slug y una descripción genérica", async () => {
    const meta = await generateMetadata({ params })
    expect(meta.title).toBe("norte | Rumbo")
    expect(meta.description).toBe("Sector de escalada en Uruguay.")
  })
})
