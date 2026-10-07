import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

let params = new URLSearchParams("")
let pushed: string[] = []
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ push: (url: string) => pushed.push(url) }),
}))

const { default: SearchBar } = await import("./SearchBar")

afterEach(() => {
  params = new URLSearchParams("")
  pushed = []
})

const activityInput = () => screen.getByPlaceholderText("¿Qué querés hacer?") as HTMLInputElement
const departmentInput = () => screen.getByPlaceholderText("¿A dónde vas?") as HTMLInputElement

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
})
