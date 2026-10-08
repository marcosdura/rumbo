import { describe, expect, it } from "vitest"
import { factsLine, priceLabel, ratingLabel, seasonNotice } from "./spotCard"

const NOW = new Date("2026-10-08T12:00:00Z")
const camping = { category: { name: "Camping" } }

describe("ratingLabel", () => {
  it("con reseñas, la calificación", () => {
    expect(ratingLabel({ review_count: 12, average_rating: 4.6 }, NOW)).toEqual({ kind: "rating", text: "4.6 (12)" })
  })

  it("sin reseñas: Nuevo si se publicó hace menos de 30 días; si no, Sin reseñas", () => {
    expect(ratingLabel({ review_count: 0, created_at: "2026-09-20T00:00:00Z" }, NOW).text).toBe("Nuevo")
    expect(ratingLabel({ review_count: 0, created_at: "2026-08-01T00:00:00Z" }, NOW).text).toBe("Sin reseñas")
    expect(ratingLabel({}, NOW).text).toBe("Sin reseñas")
  })
})

describe("priceLabel", () => {
  it("camping: por noche, o Gratis", () => {
    expect(priceLabel({ ...camping, price: 400 })).toBe("$400 / noche")
    expect(priceLabel({ ...camping, price: 0 })).toBe("Gratis")
    expect(priceLabel({ ...camping, price: null })).toBeNull()
  })

  it("glamping: desde el alojamiento más barato", () => {
    const glamping = { category: { name: "Glamping" }, glamping_detail: [{ price_per_night: 4200 }, { price_per_night: 2500 }, { price_per_night: null }] }
    expect(priceLabel(glamping)).toBe(`Desde $${(2500).toLocaleString("es-UY")} / noche`)
    expect(priceLabel({ category: { name: "Glamping" }, glamping_detail: [] })).toBeNull()
  })

  it("motorhome: por noche", () => {
    expect(priceLabel({ category: { name: "Motorhome" }, price: 250 })).toBe("$250 / noche")
  })

  it("trekking, escalada, surf y kayak no tienen precio propio del lugar: no se muestra", () => {
    for (const name of ["Trekking", "Escalada", "Surf", "Kayak"]) {
      expect(priceLabel({ category: { name }, price: 200 })).toBeNull()
      expect(priceLabel({ category: { name }, price: 0 })).toBeNull()
    }
  })

  it("manda la categoría principal", () => {
    expect(priceLabel({ categories: [{ name: "Camping" }, { name: "Trekking" }], price: 300 })).toBe("$300 / noche")
    expect(priceLabel({ categories: [{ name: "Trekking" }, { name: "Camping" }], price: 300 })).toBeNull()
  })
})

describe("seasonNotice", () => {
  it("fuera de temporada dice cuándo abre", () => {
    expect(seasonNotice({ season_start: 12, season_end: 3 }, NOW)).toBe("Abre en diciembre")
    expect(seasonNotice({ season_start: 1, season_end: 4 }, NOW)).toBe("Abre en enero")
  })

  it("en temporada (también cruzando el año) o todo el año: nada", () => {
    expect(seasonNotice({ season_start: 9, season_end: 3 }, NOW)).toBeNull()
    expect(seasonNotice({ season_start: 10, season_end: 10 }, NOW)).toBeNull()
    expect(seasonNotice({}, NOW)).toBeNull()
  })
})

describe("factsLine", () => {
  it("precio, temporada y mascotas, solo lo que hay", () => {
    expect(factsLine({ ...camping, price: 0, season_start: 12, season_end: 3, pets_allowed: true }, NOW))
      .toEqual(["Gratis", "Abre en diciembre", "🐶 Acepta mascotas"])
    expect(factsLine({ category: { name: "Escalada" }, pets_allowed: false }, NOW)).toEqual([])
  })
})
