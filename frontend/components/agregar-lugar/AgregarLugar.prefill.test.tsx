import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// API y router simulados con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts).
let responses: Record<string, unknown> = {}
let posts: string[] = []
let pushed: string[] = []
vi.mock("@/lib/api", () => ({
  api: {
    get: (url: string) => (url in responses
      ? Promise.resolve({ data: responses[url] })
      : Promise.reject(new Error("404"))),
    post: (url: string) => { posts.push(url); return Promise.resolve({ data: { id: 50, is_approved: false } }) },
    patch: () => Promise.resolve({ data: {} }),
  },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (url: string) => pushed.push(url) }) }))
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { id_token: "t", termsAcceptedAt: "2026-01-01", user: { email: "a@b.com" } }, update: () => {} }),
}))
vi.mock("next/image", () => ({ default: () => null }))
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }))
// Leaflet necesita un DOM real: el mapa del selector de lugares no se dibuja.
vi.mock("@/components/forms/SpotPickerMap", () => ({ default: () => null }))

const { default: AgregarLugar } = await import("./AgregarLugar")

const AREQUITA = { id: 12, name: "Cerro Arequita", slug: "cerro-arequita" }

function openWith(query: string) {
  window.history.pushState({}, "", `/agregar-lugar?${query}`)
  render(<AgregarLugar />)
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }))

afterEach(() => {
  responses = {}
  posts = []
  pushed = []
  window.history.pushState({}, "", "/")
})

describe("AgregarLugar por link directo", () => {
  it("sugerir un sector abre el formulario del sector", async () => {
    responses = { "/spots/12": AREQUITA }
    openWith("sumar=sector&spot=12")
    expect(await screen.findByText("Datos del sector")).toBeTruthy()
    const back = screen.getByRole("link", { name: "← Volver a Cerro Arequita" })
    expect(back.getAttribute("href")).toBe("/spots/cerro-arequita")
    expect(screen.getByText("Sugerí un sector de escalada en Cerro Arequita. Lo revisamos antes de publicarlo.")).toBeTruthy()
    expect(screen.getByText("Paso 1 de 3")).toBeTruthy()
  })

  it("sugerir una vía abre el formulario de vías del sector", async () => {
    responses = {
      "/spots/12": AREQUITA,
      "/sectors/5": { id: 5, name: "Sector Norte", spot_id: 12 },
    }
    openWith("sumar=via&spot=12&sector=5")
    expect(await screen.findByRole("heading", { name: "Vías" })).toBeTruthy()
    expect(screen.getByText("Las vías que conocés del sector Sector Norte.")).toBeTruthy()
  })

  it("un sector de otro lugar no se acepta", async () => {
    responses = {
      "/spots/12": AREQUITA,
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

describe("AgregarLugar por link directo: queda fijo en eso", () => {
  it("Atrás en el primer paso vuelve al lugar, no a elegir otra cosa", async () => {
    responses = { "/spots/12": AREQUITA }
    openWith("sumar=sector&spot=12")
    await screen.findByText("Datos del sector")
    click("Atrás")
    expect(pushed).toEqual(["/spots/cerro-arequita"])
    expect(screen.queryByText("¿Qué querés agregar?")).toBeNull()
    expect(screen.getByText("Datos del sector")).toBeTruthy()
  })

  it("Empezar de cero vuelve al formulario del sector, vacío", async () => {
    responses = { "/spots/12": AREQUITA }
    openWith("sumar=sector&spot=12")
    await screen.findByText("Datos del sector")
    fireEvent.change(screen.getByLabelText("Nombre del sector"), { target: { value: "Placa Sur" } })
    click("Siguiente")
    expect(screen.getByText("Paso 2 de 3")).toBeTruthy()
    click("Empezar de cero")
    expect(screen.getByText("Datos del sector")).toBeTruthy()
    expect((screen.getByLabelText("Nombre del sector") as HTMLInputElement).value).toBe("")
    expect(screen.getByText("Paso 1 de 3")).toBeTruthy()
  })

  it("el resumen no deja cambiar el lugar, y al terminar ofrece sugerir otro o volver", async () => {
    responses = { "/spots/12": AREQUITA }
    openWith("sumar=sector&spot=12")
    await screen.findByText("Datos del sector")
    fireEvent.change(screen.getByLabelText("Nombre del sector"), { target: { value: "Placa Sur" } })
    click("Siguiente")
    click("Siguiente")
    expect(screen.getByText("Revisá tu aporte")).toBeTruthy()
    expect(screen.queryByText("Información general")).toBeNull()
    // Solo se edita el sector: el lugar queda fijo.
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1)

    click("Confirmar y enviar")
    expect(await screen.findByText("¡Gracias por tu aporte!")).toBeTruthy()
    expect(posts).toEqual(["/sectors/"])
    expect(screen.getByRole("link", { name: "Volver a Cerro Arequita" }).getAttribute("href")).toBe("/spots/cerro-arequita")
    click("Sugerir otro sector")
    expect(screen.getByText("Datos del sector")).toBeTruthy()
  })

  it("vías: sin ninguna no deja seguir", async () => {
    responses = {
      "/spots/12": AREQUITA,
      "/sectors/5": { id: 5, name: "Sector Norte", spot_id: 12 },
    }
    openWith("sumar=via&spot=12&sector=5")
    await screen.findByRole("heading", { name: "Vías" })
    click("Quitar vía 1")
    click("Siguiente")
    expect(screen.getByText("Agregá al menos una vía.")).toBeTruthy()
  })
})

describe("AgregarLugar sin link directo", () => {
  it("se puede volver a elegir qué agregar", async () => {
    responses = { "/spots/pins": [AREQUITA] }
    openWith("")
    click(/Escalada/)
    click(/Nuevo sector/)
    fireEvent.focus(await screen.findByRole("combobox", { name: "Buscar lugar" }))
    expect(await screen.findByRole("option", { name: "Cerro Arequita" })).toBeTruthy()
    click("Atrás")
    expect(screen.getByText("¿Qué querés agregar?")).toBeTruthy()
    click("Atrás")
    expect(screen.getByRole("button", { name: /Camping/ })).toBeTruthy()
  })

  it("una ruta para un lugar propio: sin imágenes ni características, y el número de paso bien", async () => {
    responses = { "/spots/mine": [{ id: 7, name: "Quebrada", activities: ["Trekking"] }] }
    openWith("")
    click(/Trekking/)
    click(/Nueva ruta/)
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "7" } })
    click("Siguiente")
    expect(screen.getByText("Paso 4 de 5")).toBeTruthy()
    click("Siguiente")
    expect(screen.getByText("Agregá al menos una ruta.")).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Nombre de la ruta 1"), { target: { value: "Al mirador" } })
    click("Siguiente")
    expect(screen.getByText("Paso 5 de 5")).toBeTruthy()
    expect(screen.getByText("Revisá tu aporte")).toBeTruthy()
    expect(screen.queryByText("Imágenes")).toBeNull()
    expect(screen.queryByText("Características del lugar")).toBeNull()
    expect(screen.getByText("Quebrada")).toBeTruthy()
  })
})

describe("AgregarLugar: escuelas de surf", () => {
  it("ofrece todas las playas publicadas, no solo las propias", async () => {
    responses = { "/spots/pins": [{ id: 3, name: "Playa Brava" }, { id: 4, name: "La Paloma" }] }
    openWith("")
    fireEvent.click(await screen.findByText("Surf"))
    fireEvent.focus(await screen.findByRole("combobox", { name: "Buscar lugar" }))
    expect(await screen.findByRole("option", { name: /Playa Brava/ })).toBeTruthy()
    expect(screen.getByRole("option", { name: /La Paloma/ })).toBeTruthy()
  })
})
