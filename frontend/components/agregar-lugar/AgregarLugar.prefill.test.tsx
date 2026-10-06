import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Agregar lugar abierto por un link directo: tiene que saltar al formulario
// con el lugar ya elegido y ofrecer volver a él.
let responses: Record<string, unknown> = {}
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => (url in responses
      ? Promise.resolve({ data: responses[url] })
      : Promise.reject(new Error("404"))),
    post: () => Promise.resolve({ data: {} }),
    patch: () => Promise.resolve({ data: {} }),
  },
}))
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { id_token: "t", termsAcceptedAt: "2026-01-01", user: { email: "a@b.com" } }, update: () => {} }),
}))
vi.mock("next/image", () => ({ default: () => null }))
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }))

const { default: AgregarLugar } = await import("./AgregarLugar")

function openWith(query: string) {
  window.history.pushState({}, "", `/agregar-lugar?${query}`)
  render(<AgregarLugar />)
}

afterEach(() => {
  responses = {}
  window.history.pushState({}, "", "/")
})

describe("AgregarLugar por link directo", () => {
  it("sugerir un sector abre el formulario del sector", async () => {
    responses = { "/spots/12": { id: 12, name: "Cerro Arequita", slug: "cerro-arequita" } }
    openWith("sumar=sector&spot=12")
    expect(await screen.findByText("Datos del sector")).toBeTruthy()
    const back = screen.getByRole("link", { name: "← Volver a Cerro Arequita" })
    expect(back.getAttribute("href")).toBe("/spots/cerro-arequita")
  })

  it("sugerir una vía abre el formulario de vías del sector", async () => {
    responses = {
      "/spots/12": { id: 12, name: "Cerro Arequita", slug: "cerro-arequita" },
      "/sectors/5": { id: 5, name: "Sector Norte", spot_id: 12 },
    }
    openWith("sumar=via&spot=12&sector=5")
    expect(await screen.findByText("Rutas (opcional)")).toBeTruthy()
  })

  it("un sector de otro lugar no se acepta", async () => {
    responses = {
      "/spots/12": { id: 12, name: "Cerro Arequita", slug: "cerro-arequita" },
      "/sectors/5": { id: 5, name: "Otro", spot_id: 99 },
    }
    openWith("sumar=via&spot=12&sector=5")
    expect(await screen.findByText("No encontramos ese lugar. Podés elegirlo desde el formulario.")).toBeTruthy()
  })

  it("un lugar que no existe vuelve al inicio con un aviso", async () => {
    openWith("sumar=ruta&spot=999")
    expect(await screen.findByText("No encontramos ese lugar. Podés elegirlo desde el formulario.")).toBeTruthy()
    expect(screen.queryByRole("link", { name: /Volver a/ })).toBeNull()
  })
})
