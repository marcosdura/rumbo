import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { OwnerContent } from "./types"

// API simulada con funciones comunes, no vi.fn (ver
// components/agregar-lugar/submit.test.ts: Vitest 4 reporta mal las
// promesas rechazadas de un vi.fn).
let content: OwnerContent
let postResponse: { is_approved: boolean }
let posts: [string, unknown][] = []
let deletes: string[] = []
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error { status = 0 },
  api: {
    get: () => Promise.resolve({ data: content }),
    post: (url: string, body: unknown) => { posts.push([url, body]); return Promise.resolve({ data: postResponse }) },
    del: (url: string) => { deletes.push(url); return Promise.resolve({ data: {} }) },
  },
}))

const { default: ContentTab, savedMessage } = await import("./ContentTab")

beforeEach(() => {
  content = {
    experiences: [
      { id: 1, title: "Cabalgata", price: 900, is_approved: true, category: { name: "Trekking" } },
      { id: 2, title: "Pesca nocturna", price: null, is_approved: false, category: { name: "Kayak" } },
    ],
    glamping_units: [
      { id: 7, accommodation_type: "domo", capacity: 2, price_per_night: 3500, min_nights: 1, is_approved: false },
    ],
  }
  postResponse = { is_approved: false }
  posts = []
  deletes = []
})

function renderTab(showGlamping = true) {
  render(<ContentTab spotId={5} token="t" reviewed showGlamping={showGlamping} />)
}

describe("ContentTab", () => {
  it("lista lo existente y marca lo que está en revisión", async () => {
    renderTab()
    expect(await screen.findByText("Cabalgata")).toBeTruthy()
    expect(screen.getByText("Pesca nocturna")).toBeTruthy()
    expect(screen.getByText("Domo")).toBeTruthy()
    expect(screen.getAllByText("En revisión")).toHaveLength(2)
  })

  it("sin glamping no muestra la sección de alojamiento", async () => {
    renderTab(false)
    await screen.findByText("Cabalgata")
    expect(screen.queryByText("Tipos de alojamiento")).toBeNull()
  })

  it("no guarda una experiencia incompleta", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "＋ Agregar experiencia" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar experiencias" }))
    expect(await screen.findByText("Completá la categoría y el título de cada experiencia.")).toBeTruthy()
    expect(posts).toHaveLength(0)
  })

  it("guarda una experiencia nueva y avisa que queda en revisión", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "＋ Agregar experiencia" }))
    fireEvent.click(screen.getByRole("button", { name: /Surf/ }))
    fireEvent.change(screen.getByPlaceholderText("Ej: Trekking al Cerro Grande"), { target: { value: "Clase de surf" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar experiencias" }))
    expect(await screen.findByText("✓ Guardado. Queda en revisión hasta que el equipo de Rumbo lo apruebe.")).toBeTruthy()
    expect(posts).toEqual([["/spots/5/experiences", expect.objectContaining({ category_id: 4, title: "Clase de surf" })]])
  })

  it("una unidad de glamping incompleta no se guarda", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "＋ Agregar tipo de alojamiento" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar alojamientos" }))
    expect(await screen.findByText("Seleccioná un tipo de alojamiento")).toBeTruthy()
    expect(posts).toHaveLength(0)
  })

  it("borrar algo en revisión avisa que se retira", async () => {
    renderTab()
    await screen.findByText("Cabalgata")
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Pesca nocturna" }))
    expect(screen.getByText("Todavía está en revisión: se retira y no se publica.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/spots/5/experiences/2"]))
  })

  it("borrar un alojamiento usa su endpoint", async () => {
    renderTab()
    await screen.findByText("Domo")
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Domo" }))
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    await waitFor(() => expect(deletes).toEqual(["/glamping/glamping/7"]))
  })
})

describe("savedMessage", () => {
  it("distingue revisión de publicado", () => {
    expect(savedMessage([{ is_approved: false }])).toMatch(/revisión/)
    expect(savedMessage([{ is_approved: true }])).toBe("✓ Guardado correctamente")
  })
})
