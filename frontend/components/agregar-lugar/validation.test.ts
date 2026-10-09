import { describe, expect, it } from "vitest"
import { namedCount, unnamedRows } from "./validation"
import { defaultRoute, defaultSector } from "./constants"

describe("unnamedRows", () => {
  it("marca las filas con datos y sin nombre", () => {
    const rows = [
      { ...defaultRoute(), name: "Al mirador" },
      { ...defaultRoute(), distance_km: "4" },
      defaultRoute(),
    ]
    expect(unnamedRows(rows)).toEqual([1])
  })

  it("un nombre de puros espacios no cuenta", () => {
    expect(unnamedRows([{ ...defaultSector(), name: "  ", type: "boulder" }])).toEqual([0])
  })

  it("una fila vacía se ignora", () => {
    expect(unnamedRows([defaultSector()])).toEqual([])
  })
})

describe("namedCount", () => {
  it("cuenta las que tienen nombre", () => {
    expect(namedCount([{ name: "A" }, { name: " " }, { name: "" }])).toBe(1)
  })
})

describe("unnamedRows con fotos", () => {
  it("una fila con fotos pero sin nombre se marca (antes se descartaba)", () => {
    const rows = [
      { ...defaultRoute(), name: "Cumbre" },
      { ...defaultRoute(), photos: [new File(["x"], "a.jpg")] },
      defaultRoute(),
    ]
    expect(unnamedRows(rows)).toEqual([1])
  })
})
