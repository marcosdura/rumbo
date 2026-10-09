import { describe, expect, it, vi } from "vitest"
import { KIND_LABELS, itemDetails, itemPhotos } from "./contributions"

describe("itemDetails", () => {
  it("muestra solo los campos cargados, con su etiqueta", () => {
    const item = { name: "Escuela Ola", class_type: "grupal", duration: null, email: "", whatsapp: "099" }
    expect(itemDetails("surf_school", item)).toEqual([
      ["Nombre", "Escuela Ola"], ["Tipo de clase", "grupal"], ["WhatsApp", "099"],
    ])
  })

  it("los números en cero se muestran", () => {
    expect(itemDetails("glamping_unit", { accommodation_type: "domo", min_nights: 0 })).toEqual([
      ["Tipo", "domo"], ["Mínimo de noches", "0"],
    ])
  })

  it("sin elemento no hay nada que mostrar", () => {
    expect(itemDetails("kayak", null)).toEqual([])
  })
})

describe("itemPhotos", () => {
  it("devuelve las fotos cargadas", () => {
    expect(itemPhotos({ photo_1: "https://a", photo_2: null, photo_3: "https://c" })).toEqual(["https://a", "https://c"])
    expect(itemPhotos({ name: "sin fotos" })).toEqual([])
    expect(itemPhotos(null)).toEqual([])
  })
})

describe("Fotos de rutas, sectores y vías en la revisión del admin", () => {
  it("se arma la URL con el public_id y se ve de qué es", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "rumbo")
    expect(itemPhotos({ cloudinary_public_id: "rumbo/spots/7/abc", target_name: "Cumbre" }))
      .toEqual(["https://res.cloudinary.com/rumbo/image/upload/rumbo/spots/7/abc"])
    expect(itemDetails("photo", { cloudinary_public_id: "x", target_name: "Cumbre" })).toEqual([["De", "Cumbre"]])
    expect(KIND_LABELS.photo).toBe("Foto")
    vi.unstubAllEnvs()
  })
})
