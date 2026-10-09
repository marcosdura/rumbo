import { describe, expect, it } from "vitest"
import { durationLabel, kayakInfoRows, operatorPrice, operatorSeason, operatorShareImage, surfInfoRows } from "./operatorPage"
import type { PublicKayak, PublicSurfSchool } from "./types"

const base = {
  id: 4, name: "X", duration: null, email: null, whatsapp: null, instagram: null,
  season_start: null, season_end: null, photo_1: null, photo_2: null, photo_3: null,
  spot_id: 3, spot_name: "Playa Brava", spot_department: "Rocha", spot_slug: null, spot_lat: null, spot_lng: null,
  description: null, price_from: null, price_note: null,
}
const surf = (extra: Partial<PublicSurfSchool>): PublicSurfSchool =>
  ({ ...base, class_type: null, equipment_include: null, levels: null, languages: null, ...extra })
const kayak = (extra: Partial<PublicKayak>): PublicKayak =>
  ({ ...base, water_type: null, difficulty: null, kayak_type: null, rental_available: null, includes_guide: null, includes_life_jacket: null, ...extra })
const text = (rows: { label: string; value: string }[]) => rows.map(r => `${r.label}: ${r.value}`)

describe("Información de escuelas y servicios", () => {
  it("duración con coma decimal", () => {
    expect(durationLabel(1.5)).toBe("⏱️ 1,5 horas")
    expect(durationLabel(1)).toBe("⏱️ 1 hora")
  })

  it("temporada: sin meses es Todo el año (la opción por defecto del formulario)", () => {
    expect(operatorSeason(11, 3)).toBe("Noviembre – Marzo")
    expect(operatorSeason(null, null)).toBe("Todo el año")
  })

  it("surf, en orden y solo lo que se sabe", () => {
    expect(text(surfInfoRows(surf({ class_type: "grupal", duration: 2, equipment_include: true, levels: ["principiante"], season_start: 12, season_end: 3 }))))
      .toEqual(["Tipo de clase: 👥 Grupal", "Duración: ⏱️ 2 horas", "Equipo: 🩳 Incluido", "Niveles: Principiante", "Temporada: Diciembre – Marzo"])
  })

  it("kayak: dificultad como pill y guía/chaleco/alquiler solo si se saben", () => {
    const rows = kayakInfoRows(kayak({ difficulty: "dificil", rental_available: false, includes_guide: true }))
    expect(rows.find(r => r.label === "Dificultad")).toEqual({ label: "Dificultad", value: "Difícil", pill: "red" })
    expect(text(rows)).toContain("Alquiler: 🏪 No disponible")
    expect(text(rows)).toContain("🧭 Guía: Sí")
    expect(rows.map(r => r.label)).not.toContain("🦺 Chaleco salvavidas")
    expect(kayakInfoRows(kayak({})).map(r => r.label)).toEqual(["Temporada"])
  })
})

describe("Foto al compartir", () => {
  it("se recorta si es de Cloudinary; si no, queda igual", () => {
    expect(operatorShareImage("https://res.cloudinary.com/r/image/upload/v1/x.jpg"))
      .toBe("https://res.cloudinary.com/r/image/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/v1/x.jpg")
    expect(operatorShareImage("https://otro.com/x.jpg")).toBe("https://otro.com/x.jpg")
  })
})

describe("Precio de escuelas y servicios", () => {
  it("desde, con la nota del dueño; 0 es gratis; sin precio, nada", () => {
    expect(operatorPrice(1200, " por clase ")).toBe("Desde $1.200 por clase")
    expect(operatorPrice(800, null)).toBe("Desde $800")
    expect(operatorPrice(0, "por clase")).toBe("Gratis")
    expect(operatorPrice(null, "por clase")).toBeNull()
  })

  it("es la primera fila de Información", () => {
    expect(surfInfoRows(surf({ price_from: 1200, price_note: "por clase", class_type: "grupal" }))[0])
      .toEqual({ label: "Precio", value: "Desde $1.200 por clase" })
    expect(kayakInfoRows(kayak({ price_from: 900, price_note: "por hora" }))[0])
      .toEqual({ label: "Precio", value: "Desde $900 por hora" })
  })
})
