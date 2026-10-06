import { describe, expect, it } from "vitest"
import { itemDetails, itemPhotos } from "./contributions"

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
