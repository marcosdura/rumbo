import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

let params = new URLSearchParams("")
let pushed: string[] = []
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ push: (url: string) => pushed.push(url) }),
}))
// Los lugares que sugiere el backend (GET /spots/suggest), y qué se le pidió.
let asked: string[] = []
const PLACES = [
  { id: 1, name: "Cerro Arequita", slug: "cerro-arequita", department: "Lavalleja", category: "Escalada" },
  { id: 2, name: "Rocas de Rocha", slug: "rocas-de-rocha", department: "Rocha", category: "Escalada" },
]
vi.mock("@/lib/api", () => ({
  api: {
    get: (_url: string, { params: p }: { params: { q: string } }) => {
      asked.push(p.q)
      return Promise.resolve({ data: PLACES.filter(x => x.name.toLowerCase().includes(p.q)) })
    },
  },
}))

const { default: SearchBar } = await import("./SearchBar")

afterEach(() => {
  params = new URLSearchParams("")
  pushed = []
  asked = []
})

// Las sugerencias se piden un momento después de dejar de escribir.
const waitSuggestions = () => act(() => new Promise(r => setTimeout(r, 260)))

const activityInput = () => screen.getByPlaceholderText("¿Qué querés hacer?") as HTMLInputElement
const departmentInput = () => screen.getByPlaceholderText("Departamento o lugar") as HTMLInputElement

describe("SearchBar", () => {
  it("arranca con lo que dice la URL", () => {
    params = new URLSearchParams("activity=Surf&department=Rocha")
    render(<SearchBar />)
    expect(activityInput().value).toBe("Surf")
    expect(departmentInput().value).toBe("Rocha")
  })

  it("si la URL cambia, los campos la siguen", () => {
    params = new URLSearchParams("activity=Surf&department=Rocha")
    const { rerender } = render(<SearchBar />)
    params = new URLSearchParams("activity=Kayak")
    rerender(<SearchBar />)
    expect(activityInput().value).toBe("Kayak")
    expect(departmentInput().value).toBe("")
  })

  it("al escribir se resalta de nuevo la primera opción", () => {
    render(<SearchBar />)
    fireEvent.focus(activityInput())
    fireEvent.keyDown(activityInput(), { key: "ArrowDown" })
    fireEvent.keyDown(activityInput(), { key: "ArrowDown" })
    // "a" filtra a Camping, Glamping, Escalada, Kayak, Trekking...: sin el
    // reinicio, Enter elegiría la tercera.
    fireEvent.change(activityInput(), { target: { value: "a" } })
    fireEvent.keyDown(activityInput(), { key: "Enter" })
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }))
    expect(pushed).toEqual(["/search?activity=Camping&department="])
  })

  it("la X aparece al elegir, y sigue al volver a abrir el campo (antes se ocultaba justo ahí)", () => {
    render(<SearchBar />)
    fireEvent.focus(activityInput())
    fireEvent.mouseDown(screen.getByText(/Surf/))
    expect(screen.getByRole("button", { name: "Borrar actividad" })).toBeTruthy()
    // Vuelve a tocar el campo: se abre la lista y la X sigue ahí.
    fireEvent.click(activityInput())
    fireEvent.focus(activityInput())
    fireEvent.mouseDown(screen.getByRole("button", { name: "Borrar actividad" }))
    expect(activityInput().value).toBe("")
    expect(screen.queryByRole("button", { name: "Borrar actividad" })).toBeNull()
  })

  it("lo escrito también se borra con la X, y el campo queda abierto", () => {
    render(<SearchBar />)
    fireEvent.focus(departmentInput())
    fireEvent.change(departmentInput(), { target: { value: "Ro" } })
    fireEvent.mouseDown(screen.getByRole("button", { name: "Borrar dónde" }))
    expect(departmentInput().value).toBe("")
    expect(screen.getByText("Rocha")).toBeTruthy()
  })

  it("Dónde: al escribir, los departamentos arriba y los lugares abajo; un lugar lleva a su página", async () => {
    render(<SearchBar />)
    fireEvent.focus(departmentInput())
    fireEvent.change(departmentInput(), { target: { value: "Roc" } })
    await waitSuggestions()
    expect(asked).toEqual(["roc"])
    const items = [...document.querySelectorAll(".search-dropdown-item")].map(el => el.textContent)
    expect(items).toEqual(["Rocha", "Rocas de RochaEscalada · Rocha", "🔎 Buscar «Roc»"])
    expect(screen.getByText("Lugares")).toBeTruthy()
    fireEvent.mouseDown(screen.getByText("Rocas de Rocha"))
    expect(pushed).toEqual(["/spots/rocas-de-rocha"])
  })

  it("Dónde: con una letra no pide lugares, y con el teclado se recorre todo", async () => {
    render(<SearchBar />)
    fireEvent.focus(departmentInput())
    fireEvent.change(departmentInput(), { target: { value: "r" } })
    await waitSuggestions()
    expect(asked).toEqual([])
    fireEvent.change(departmentInput(), { target: { value: "areq" } })
    await waitSuggestions()
    fireEvent.keyDown(departmentInput(), { key: "Enter" })
    expect(pushed).toEqual(["/spots/cerro-arequita"])
  })

  it("Dónde: buscar un texto que no es departamento busca por nombre (q)", async () => {
    render(<SearchBar />)
    fireEvent.focus(departmentInput())
    fireEvent.change(departmentInput(), { target: { value: "cascada" } })
    await waitSuggestions()
    fireEvent.keyDown(departmentInput(), { key: "Enter" })
    expect(departmentInput().value).toBe("cascada")
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }))
    expect(pushed).toEqual(["/search?activity=&department=&q=cascada"])
  })

  it("Dónde: escrito y sin elegir, si es un departamento se busca como departamento", () => {
    render(<SearchBar />)
    fireEvent.focus(departmentInput())
    fireEvent.change(departmentInput(), { target: { value: "rocha" } })
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }))
    fireEvent.focus(departmentInput())
    fireEvent.change(departmentInput(), { target: { value: "arroyo" } })
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }))
    expect(pushed).toEqual(["/search?activity=&department=Rocha", "/search?activity=&department=&q=arroyo"])
  })

  it("Dónde: arranca con el texto buscado de la URL", () => {
    params = new URLSearchParams("q=cascada")
    render(<SearchBar />)
    expect(departmentInput().value).toBe("cascada")
  })
})
