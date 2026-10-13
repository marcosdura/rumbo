import { describe, expect, it, vi } from "vitest"
import { KIND_LABELS, itemDetails, itemPhotos } from "./contributions"

describe("itemDetails", () => {
  it("muestra solo los campos cargados, con su etiqueta", () => {
    const item = { name: "La Diagonal", grade: "6a", type: null, description: "", bolts: 8 }
    expect(itemDetails("climbing_route", item)).toEqual([
      ["Nombre", "La Diagonal"], ["Grado", "6a"], ["Chapas", "8"],
    ])
  })

  it("los números en cero se muestran", () => {
    expect(itemDetails("glamping_unit", { accommodation_type: "domo", min_nights: 0 })).toEqual([
      ["Tipo", "domo"], ["Mínimo de noches", "0"],
    ])
  })

  it("sin elemento no hay nada que mostrar", () => {
    expect(itemDetails("trekking_route", null)).toEqual([])
  })

  it("un aporte viejo de escuela (ya no se crean) tiene nombre y nada más", () => {
    expect(KIND_LABELS.surf_school).toBe("Escuela de surf")
    expect(itemDetails("surf_school", { name: "Escuela Ola" })).toEqual([])
  })
})

describe("itemPhotos", () => {
  it("sin foto no hay nada (las URLs viejas de escuelas ya no se muestran)", () => {
    expect(itemPhotos({ photo_1: "https://a" })).toEqual([])
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
