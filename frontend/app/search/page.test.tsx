import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const calls: string[] = []
let fail = false
vi.mock("./SearchPageContent", () => ({
  default: ({ initial }: { initial: unknown }) => <pre data-testid="initial">{JSON.stringify(initial)}</pre>,
}))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => null }))
vi.mock("@/lib/api", () => ({
  api: {
    get: async (url: string) => {
      calls.push(url)
      if (fail) throw new Error("caído")
      return { data: [{ id: 1, name: "Laguna Negra" }], totalCount: 30 }
    },
  },
}))

const { default: SearchPage } = await import("./page")
const page = async (sp: Record<string, string | string[]>) => render(await SearchPage({ searchParams: Promise.resolve(sp) }))
const initial = () => JSON.parse(screen.getByTestId("initial").textContent!)

afterEach(() => { calls.length = 0; fail = false })

describe("Búsqueda en el servidor", () => {
  it("trae la primera tanda con los mismos filtros de la URL, y le dice al navegador de qué URL es", async () => {
    await page({ activity: "Camping", department: "Rocha" })
    expect(calls).toEqual(["/spots?activity=Camping&department=Rocha&sort=recommended&limit=24&offset=0"])
    expect(initial()).toEqual({ query: "activity=Camping&department=Rocha", spots: [{ id: 1, name: "Laguna Negra" }], total: 30 })
  })

  it("si el backend falla, la página sale igual y los pide el navegador", async () => {
    fail = true
    await page({ activity: "Camping" })
    expect(initial()).toBeNull()
  })
})
