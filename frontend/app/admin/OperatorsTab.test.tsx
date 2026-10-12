import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"

let operators: unknown[] = []
let failDelete = false
let calls: string[] = []
vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    constructor(public status: number, m: string) { super(m) }
  }
  return {
    ApiError,
    api: {
      get: (url: string) => { calls.push(`get ${url}`); return Promise.resolve({ data: operators }) },
      del: (url: string) => { calls.push(`del ${url}`); return failDelete ? Promise.reject(new ApiError(500, "Error 500")) : Promise.resolve({ data: {} }) },
    },
  }
})

const { default: OperatorsTab } = await import("./OperatorsTab")

const op = (extra: object) => ({
  kind: "surf_school", id: 4, name: "Escuela Ola", spot: { id: 3, name: "Playa Brava", department: "Rocha" },
  owner_email: "ola@test.com", is_approved: true, photos: 2, has_description: true, review_count: 3, average_rating: 4.7, ...extra,
})

afterEach(() => { operators = []; failDelete = false; calls = [] })

const load = async () => { render(<OperatorsTab token="t" />); await act(() => Promise.resolve()) }
const row = (name: string) => screen.getByText(name).closest(".spot-row") as HTMLElement

describe("Escuelas y servicios en el admin", () => {
  it("lista escuelas y kayaks con su playa, estado y datos", async () => {
    operators = [op({}), op({ kind: "kayak", id: 4, name: "Kayak Sur", is_approved: false, photos: 0, has_description: false, owner_email: null })]
    await load()
    expect(within(row("Escuela Ola")).getByText("Publicado")).toBeTruthy()
    expect(row("Escuela Ola").textContent).toContain("en Playa Brava · Rocha")
    expect(row("Escuela Ola").textContent).toContain("⭐ 4.7 (3)")
    const kayak = row("Kayak Sur")
    expect(within(kayak).getByText("En revisión")).toBeTruthy()
    expect(within(kayak).getByText("Sin descripción")).toBeTruthy()
    expect(within(kayak).getByText("Sin dueño")).toBeTruthy()
  })

  it("Ver va a la página pública (solo si está publicado); Editar, a su panel", async () => {
    operators = [op({}), op({ kind: "kayak", id: 9, name: "Kayak Sur", is_approved: false })]
    await load()
    expect(within(row("Escuela Ola")).getByRole("link", { name: "Ver" }).getAttribute("href")).toBe("/surf/escuela-ola-4")
    expect(within(row("Escuela Ola")).getByRole("link", { name: "Editar" }).getAttribute("href")).toBe("/dashboard/operadores/surf_school/4")
    expect(within(row("Kayak Sur")).queryByRole("link", { name: "Ver" })).toBeNull()
    expect(within(row("Kayak Sur")).getByRole("link", { name: "Editar" }).getAttribute("href")).toBe("/dashboard/operadores/kayak/9")
  })

  it("filtra por tipo y busca por nombre, playa, departamento o dueño", async () => {
    operators = [op({}), op({ kind: "kayak", id: 5, name: "Kayak Sur", spot: { id: 8, name: "Laguna", department: "Maldonado" } })]
    await load()
    fireEvent.click(screen.getByRole("button", { name: "Kayak (1)" }))
    expect(screen.queryByText("Escuela Ola")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Todos (2)" }))
    fireEvent.change(screen.getByPlaceholderText(/Buscar/), { target: { value: "maldonado" } })
    expect(screen.queryByText("Escuela Ola")).toBeNull()
    expect(screen.getByText("Kayak Sur")).toBeTruthy()
  })

  it("eliminar pide confirmar, usa el endpoint de su tipo y lo saca de la lista", async () => {
    operators = [op({ kind: "kayak", id: 5, name: "Kayak Sur" })]
    await load()
    fireEvent.click(within(row("Kayak Sur")).getByRole("button", { name: "Eliminar" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByPlaceholderText("CONFIRMAR"), { target: { value: "CONFIRMAR" } })
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" })) })
    expect(calls).toContain("del /kayak/5")
    expect(screen.queryByText("Kayak Sur")).toBeNull()
  })

  it("si eliminar falla, lo dice y sigue en la lista", async () => {
    operators = [op({})]
    failDelete = true
    await load()
    fireEvent.click(within(row("Escuela Ola")).getByRole("button", { name: "Eliminar" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByPlaceholderText("CONFIRMAR"), { target: { value: "CONFIRMAR" } })
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" })) })
    expect(calls).toContain("del /surfschool/4")
    expect(within(screen.getByRole("dialog")).getByText("No se pudo eliminar. Intentá de nuevo.")).toBeTruthy()
  })
})
