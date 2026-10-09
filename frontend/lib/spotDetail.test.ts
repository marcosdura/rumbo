import { describe, expect, it } from "vitest"
import { detailRows, directionsUrl, offSeasonNotice, seasonLabel, whatsappUrl } from "./spotDetail"

const labels = (rows: { label: string; value: string }[]) => rows.map(r => `${r.label}: ${r.value}`)

describe("Panel Detalles: solo lo que se sabe y no está en otro lado", () => {
  it("camping: precio por noche como la card; gratis si es 0", () => {
    expect(labels(detailRows({ category: { name: "Camping" }, price: 450 }))).toEqual(["Precio: $450 / noche"])
    expect(labels(detailRows({ category: { name: "Camping" }, price: 0 }))).toEqual(["Precio: Gratis"])
  })

  it("glamping: desde el alojamiento más barato", () => {
    const rows = detailRows({ category: { name: "Glamping" }, glamping_detail: [{ price_per_night: 5000 }, { price_per_night: 3200 }] })
    expect(labels(rows)).toEqual(["Precio: Desde $3.200 / noche"])
  })

  it("trekking no tiene precio propio: sin fila (antes 'Información no disponible')", () => {
    expect(detailRows({ category: { name: "Trekking" }, price: 300 })).toEqual([])
  })

  it("el precio va por la categoría principal, no por el orden de categories", () => {
    const rows = detailRows({ category: { name: "Camping" }, categories: [{ name: "Trekking" }, { name: "Camping" }], price: 500 })
    expect(labels(rows)).toEqual(["Precio: $500 / noche"])
  })

  it("temporada y transporte solo si se saben", () => {
    expect(labels(detailRows({ season_start: 11, season_end: 3, public_transport: "si" })))
      .toEqual(["Temporada: Nov – Mar", "Transporte público: 🚌 Accesible"])
    expect(detailRows({ public_transport: "no_se" })).toEqual([])
    expect(seasonLabel(null, null)).toBeNull()
  })

  it("fuera de temporada, para el encabezado", () => {
    const julio = new Date(2026, 6, 15)
    expect(offSeasonNotice({ season_start: 11, season_end: 3 }, julio)).toBe("Fuera de temporada · abre en noviembre")
    expect(offSeasonNotice({ season_start: 11, season_end: 3 }, new Date(2026, 0, 10))).toBeNull()
  })
})

describe("Llegar y contactar", () => {
  it("cómo llegar va a las coordenadas, no a una búsqueda por nombre", () => {
    expect(directionsUrl(-34.9, -54.95)).toBe("https://www.google.com/maps/dir/?api=1&destination=-34.9,-54.95")
  })

  it("WhatsApp con el mensaje escrito y el número limpio", () => {
    const url = new URL(whatsappUrl("+598 99 123 456", "Camping La Aguada"))
    expect(url.origin + url.pathname).toBe("https://wa.me/59899123456")
    expect(url.searchParams.get("text")).toBe("Hola, te escribo por Camping La Aguada, que vi en Rumbo.")
  })
})
