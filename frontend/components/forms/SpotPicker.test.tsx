import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"

// Leaflet necesita un DOM real; el mapa se reemplaza por un botón por pin.
vi.mock("next/dynamic", () => ({
  default: () => ({ spots, onSelect }: { spots: { id: number; name: string }[]; onSelect: (id: number) => void }) => (
    <div data-testid="mapa">
      {spots.map(s => <button key={s.id} onClick={() => onSelect(s.id)}>pin {s.name}</button>)}
    </div>
  ),
}))

const { default: SpotPicker } = await import("./SpotPicker")

const beaches = [
  { id: 1, name: "Playa Brava", department: "Maldonado", lat: -34.9, lng: -54.9 },
  { id: 2, name: "La Pedrera", department: "Rocha", lat: -34.6, lng: -54.1 },
  { id: 3, name: "Playa sin ubicación", department: "Rocha", lat: null, lng: null },
]

function Harness() {
  const [selected, setSelected] = useState<number | null>(null)
  return <SpotPicker spots={beaches} selectedId={selected} onSelect={setSelected} />
}

const input = () => screen.getByRole("combobox", { name: "Buscar lugar" })

describe("SpotPicker", () => {
  it("escribir filtra la lista y elegir una la marca", () => {
    render(<Harness />)
    fireEvent.change(input(), { target: { value: "pedre" } })
    const options = screen.getAllByRole("option")
    expect(options.map(o => o.textContent)).toEqual(["La PedreraRocha"])
    fireEvent.mouseDown(options[0])
    expect(screen.getByText("La Pedrera", { selector: "strong" })).toBeTruthy()
  })

  it("busca también por departamento y se elige con el teclado", () => {
    render(<Harness />)
    fireEvent.change(input(), { target: { value: "rocha" } })
    fireEvent.keyDown(input(), { key: "ArrowDown" })
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(screen.getByText("Playa sin ubicación", { selector: "strong" })).toBeTruthy()
  })

  it("sin resultados lo dice", () => {
    render(<Harness />)
    fireEvent.change(input(), { target: { value: "zzz" } })
    expect(screen.getByText("No hay lugares con ese nombre.")).toBeTruthy()
  })

  it("en el mapa están los que tienen ubicación, y tocar un pin lo elige", () => {
    render(<Harness />)
    expect(screen.getAllByRole("button", { name: /^pin / })).toHaveLength(2)
    fireEvent.click(screen.getByRole("button", { name: "pin Playa Brava" }))
    expect(screen.getByText("Playa Brava", { selector: "strong" })).toBeTruthy()
  })
})
