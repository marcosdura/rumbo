import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import SortMenu from "./SortMenu"

const OPTIONS = [
  { value: "recommended", label: "Recomendados" },
  { value: "rating", label: "Mejor calificados" },
  { value: "name", label: "Nombre (A–Z)" },
] as const

const setup = (value = "recommended") => {
  const onChange = vi.fn()
  render(<SortMenu label="Ordenar" value={value} options={OPTIONS} onChange={onChange} />)
  return { onChange, box: screen.getByRole("combobox", { name: "Ordenar" }) }
}

describe("SortMenu", () => {
  it("muestra lo elegido; al abrir, la lista con el estilo de la página y la opción marcada", () => {
    const { box } = setup("rating")
    expect(box.textContent).toContain("Mejor calificados")
    expect(screen.queryByRole("listbox")).toBeNull()
    fireEvent.click(box)
    expect(box.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("option", { name: /Mejor calificados/ }).getAttribute("aria-selected")).toBe("true")
  })

  it("elegir otra avisa y cierra; la misma no avisa", () => {
    const { box, onChange } = setup()
    fireEvent.click(box)
    fireEvent.mouseDown(screen.getByRole("option", { name: /Recomendados/ }))
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(box)
    fireEvent.mouseDown(screen.getByRole("option", { name: /Nombre/ }))
    expect(onChange).toHaveBeenCalledWith("name")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("con el teclado: flechas para moverse, Enter para elegir, Escape para cerrar", () => {
    const { box, onChange } = setup()
    fireEvent.keyDown(box, { key: "ArrowDown" })
    expect(screen.getByRole("listbox")).toBeTruthy()
    fireEvent.keyDown(box, { key: "ArrowDown" })
    fireEvent.keyDown(box, { key: "ArrowDown" })
    fireEvent.keyDown(box, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("name")
    fireEvent.keyDown(box, { key: "Enter" })
    fireEvent.keyDown(box, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("se cierra al tocar afuera", () => {
    const { box } = setup()
    fireEvent.click(box)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
