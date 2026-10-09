import { describe, expect, it } from "vitest"
import { cameFromRumbo, detailRows, directionsUrl, offSeasonNotice, seasonLabel, shareImageUrl, whatsappUrl } from "./spotDetail"

const labels = (rows: { label: string; value: string }[]) => rows.map(r => `${r.label}: ${r.value}`)

describe("Panel Detalles: solo lo que se sabe y no está en otro lado", () => {
  it("camping: precio por noche como la card; gratis si es 0", () => {
    expect(labels(detailRows({ category: { name: "Camping" }, price: 450 }))).toEqual(["Precio: $450 / noche", "Temporada: Todo el año"])
    expect(labels(detailRows({ category: { name: "Camping" }, price: 0 }))[0]).toBe("Precio: Gratis")
  })

  it("glamping: desde el alojamiento más barato", () => {
    const rows = detailRows({ category: { name: "Glamping" }, glamping_detail: [{ price_per_night: 5000 }, { price_per_night: 3200 }] })
    expect(labels(rows)[0]).toBe("Precio: Desde $3.200 / noche")
  })

  it("trekking no tiene precio propio: sin fila (antes 'Información no disponible')", () => {
    expect(detailRows({ category: { name: "Trekking" }, price: 300 }).map(r => r.label)).not.toContain("Precio")
  })

  it("el precio va por la categoría principal, no por el orden de categories", () => {
    const rows = detailRows({ category: { name: "Camping" }, categories: [{ name: "Trekking" }, { name: "Camping" }], price: 500 })
    expect(labels(rows)[0]).toBe("Precio: $500 / noche")
  })

  it("temporada: sin meses es Todo el año (la opción por defecto del formulario); transporte solo si se sabe", () => {
    expect(labels(detailRows({ season_start: 11, season_end: 3, public_transport: "si" })))
      .toEqual(["Temporada: Nov – Mar", "Transporte público: 🚌 Accesible"])
    expect(labels(detailRows({ public_transport: "no_se" }))).toEqual(["Temporada: Todo el año"])
    expect(seasonLabel(null, null)).toBe("Todo el año")
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

describe("← Volver", () => {
  it("vuelve atrás solo si se llegó desde otra página de Rumbo", () => {
    expect(cameFromRumbo("https://rumbo.uy/search?activity=Surf", "https://rumbo.uy")).toBe(true)
    expect(cameFromRumbo("https://l.instagram.com/?u=x", "https://rumbo.uy")).toBe(false)
    expect(cameFromRumbo("", "https://rumbo.uy")).toBe(false)
  })
})

describe("Al compartir", () => {
  it("la foto va recortada a 1200×630, no la original", () => {
    expect(shareImageUrl("rumbo", "rumbo/spots/1/foto"))
      .toBe("https://res.cloudinary.com/rumbo/image/upload/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/rumbo/spots/1/foto")
  })
})
