import { describe, expect, it } from "vitest"
import { addToSpotUrl, parsePrefill } from "./prefill"

const parse = (query: string) => parsePrefill(new URLSearchParams(query))

describe("parsePrefill", () => {
  it("lee qué sumar y a qué lugar", () => {
    expect(parse("sumar=sector&spot=12")).toEqual({ kind: "sector", spotId: 12, sectorId: null })
    expect(parse("sumar=ruta&spot=3")).toEqual({ kind: "ruta", spotId: 3, sectorId: null })
    expect(parse("sumar=via&spot=12&sector=5")).toEqual({ kind: "via", spotId: 12, sectorId: 5 })
  })

  it("una vía sin sector no sirve", () => {
    expect(parse("sumar=via&spot=12")).toBeNull()
  })

  it("el sector solo cuenta para una vía", () => {
    expect(parse("sumar=sector&spot=12&sector=5")).toEqual({ kind: "sector", spotId: 12, sectorId: null })
  })

  it("ignora links rotos o inventados", () => {
    expect(parse("")).toBeNull()
    expect(parse("sumar=sector")).toBeNull()
    expect(parse("sumar=hotel&spot=12")).toBeNull()
    expect(parse("sumar=sector&spot=abc")).toBeNull()
    expect(parse("sumar=sector&spot=-1")).toBeNull()
    expect(parse("sumar=sector&spot=0")).toBeNull()
    expect(parse("sumar=sector&spot=1.5")).toBeNull()
  })
})

describe("addToSpotUrl", () => {
  it("arma el link que después se lee igual", () => {
    expect(addToSpotUrl("sector", 12)).toBe("/agregar-lugar?sumar=sector&spot=12")
    expect(addToSpotUrl("via", 12, 5)).toBe("/agregar-lugar?sumar=via&spot=12&sector=5")
    const query = addToSpotUrl("via", 12, 5).split("?")[1]
    expect(parse(query)).toEqual({ kind: "via", spotId: 12, sectorId: 5 })
  })
})
