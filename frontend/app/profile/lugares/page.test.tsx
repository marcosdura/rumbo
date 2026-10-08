import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

let status: "authenticated" | "unauthenticated" = "authenticated"
let pushed: string[] = []
let responses: Record<string, unknown> = {}
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: status === "authenticated" ? { id_token: "t" } : null, status }),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (url: string) => pushed.push(url) }) }))
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }))
vi.mock("@/components/ui/LoadingScreen", () => ({ default: () => <p>pantalla de carga</p> }))
vi.mock("../MyOperatorsCard", () => ({ default: () => <p>tus escuelas</p> }))
vi.mock("@/lib/api", () => ({
  api: { get: (url: string) => Promise.resolve({ data: responses[url] ?? [] }) },
}))

const { default: ManagedPlacesPage } = await import("./page")

afterEach(() => {
  status = "authenticated"
  pushed = []
  responses = {}
})

const mySpot = (id: number, name: string) => ({ id, name, images: [], is_approved: true, review_count: 0 })
const flush = () => act(() => Promise.resolve())

describe("Lugares que administrás", () => {
  it("tus lugares, tus escuelas y los que sugeriste, sin repetir el sugerido en revisión", async () => {
    responses = {
      "/spots/mine": [mySpot(1, "Mi camping"), mySpot(2, "Sugerido en revisión")],
      "/me/suggested": [
        { id: 2, name: "Sugerido en revisión", slug: null, category: "Camping", department: "Rocha", status: "pending", rejection_reason: null, image: null },
        { id: 3, name: "Sugerido publicado", slug: "sugerido-publicado", category: null, department: null, status: "approved", rejection_reason: null, image: null },
      ],
    }
    render(<ManagedPlacesPage />)
    await flush()
    expect(screen.getByRole("heading", { name: "Lugares que administrás" })).toBeTruthy()
    expect(screen.getByText("Mi camping")).toBeTruthy()
    expect(screen.getByText("tus escuelas")).toBeTruthy()
    expect(screen.getAllByText("Sugerido en revisión")).toHaveLength(1)
    expect(screen.getByRole("link", { name: "Ver →" }).getAttribute("href")).toBe("/spots/sugerido-publicado")
    expect(screen.getByRole("link", { name: "← Volver al perfil" }).getAttribute("href")).toBe("/profile")
  })

  it("sin sesión vuelve al inicio", () => {
    status = "unauthenticated"
    render(<ManagedPlacesPage />)
    expect(pushed).toEqual(["/"])
  })
})
