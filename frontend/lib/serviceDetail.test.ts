import { describe, expect, it } from "vitest"
import { kayakRows, servicePriceNote, surfRows } from "./serviceDetail"
import { priceLabel } from "./spotCard"

const surf = { class_type: "privada", duration: 1, equipment_include: false, levels: ["principiante", "avanzado"], languages: null, price_note: "por clase", operates_at: " Playa El Emir " }

describe("datos de escuelas y servicios", () => {
  it("escuela: dónde opera primero y solo lo que se sabe", () => {
    expect(surfRows(surf).map(r => [r.label, r.value])).toEqual([
      ["Dónde opera", "📍 Playa El Emir"],
      ["Tipo de clase", "🧑 Privada"],
      ["Duración", "⏱️ 1 hora"],
      ["Equipo", "🩳 No incluido"],
      ["Niveles", "Principiante, Avanzado"],
    ])
  })

  it("kayak: la dificultad como pill de color", () => {
    const rows = kayakRows({ water_type: "rio", difficulty: "dificil", duration: 2.5, kayak_type: "rapido", rental_available: null, includes_guide: true, includes_life_jacket: false, price_note: null, operates_at: null })
    expect(rows.find(r => r.label === "Dificultad")).toEqual({ label: "Dificultad", value: "Difícil", pill: "red" })
    expect(rows.map(r => r.label)).toEqual(["Tipo de agua", "Dificultad", "Duración", "Tipo de kayak", "🧭 Guía", "🦺 Chaleco salvavidas"])
  })
})

describe("precio de una escuela o servicio", () => {
  const school = { category: { name: "Surf" }, price: 1200, surf_detail: surf }

  it("'Desde $1.200 por clase' (en camping es por noche)", () => {
    expect(priceLabel(school)).toBe("Desde $1.200 por clase")
    expect(priceLabel({ ...school, surf_detail: { ...surf, price_note: null } })).toBe("Desde $1.200")
    expect(priceLabel({ ...school, price: 0 })).toBe("Gratis")
    expect(priceLabel({ ...school, price: null })).toBeNull()
  })

  it("una playa no tiene precio", () => {
    expect(servicePriceNote({})).toBeUndefined()
    expect(priceLabel({ category: { name: "Surf" }, price: 500 })).toBeNull()
  })
})
