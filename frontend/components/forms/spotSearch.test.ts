import { describe, expect, it } from "vitest"
import { hasCoords, searchSpots } from "./spotSearch"

const spots = [
  { id: 1, name: "Playa Brava", department: "Maldonado" },
  { id: 2, name: "La Pedrera", department: "Rocha" },
  { id: 3, name: "Punta del Diablo", department: "Rocha" },
  { id: 4, name: "El Pinar", department: "Canelones" },
]

describe("searchSpots", () => {
  it("sin texto devuelve todos", () => {
    expect(searchSpots(spots, "  ")).toHaveLength(4)
  })

  it("por nombre, sin importar mayúsculas ni tildes", () => {
    expect(searchSpots(spots, "PEDRERA").map(s => s.id)).toEqual([2])
    expect(searchSpots([{ id: 9, name: "Cerro Áspero" }], "aspero").map(s => s.id)).toEqual([9])
  })

  it("por departamento", () => {
    expect(searchSpots(spots, "rocha").map(s => s.id)).toEqual([2, 3])
  })

  it("primero los que empiezan con lo escrito", () => {
    expect(searchSpots(spots, "p").map(s => s.id).slice(0, 3)).toEqual([1, 3, 2])
  })
})

describe("hasCoords", () => {
  it("solo con latitud y longitud", () => {
    expect(hasCoords({ id: 1, name: "A", lat: -34, lng: -54 })).toBe(true)
    expect(hasCoords({ id: 1, name: "A", lat: null, lng: -54 })).toBe(false)
  })
})
