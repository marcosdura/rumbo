import { describe, expect, it } from "vitest"
import { defaultExperience, defaultGlampingDetail } from "./constants"
import { experiencePayload, glampingUnitPayload, missingGlampingFields } from "./payloads"

describe("experiencePayload", () => {
  it("incompleta (sin título o sin categoría) devuelve null", () => {
    expect(experiencePayload({ ...defaultExperience(), title: "Pesca" })).toBeNull()
    expect(experiencePayload({ ...defaultExperience(), category_id: "4" })).toBeNull()
    expect(experiencePayload({ ...defaultExperience(), category_id: "4", title: "   " })).toBeNull()
  })

  it("arma lo que espera el backend", () => {
    const payload = experiencePayload({
      ...defaultExperience(), category_id: "4", title: "  Clase de surf ", price: "1500",
      schedule_type: "personalizado", schedule_custom: " Sábados ", contact: "",
    })
    expect(payload).toEqual({
      category_id: 4, title: "Clase de surf", description: null, price: 1500,
      currency: "UYU", schedule: "Sábados", contact: null,
    })
  })
})

describe("glamping", () => {
  it("glampingUnitPayload convierte los números", () => {
    expect(glampingUnitPayload({ accommodation_type: "domo", capacity: "2", price_per_night: "3500.5", min_nights: "0" }))
      .toEqual({ accommodation_type: "domo", capacity: 2, price_per_night: 3500.5, min_nights: 0 })
  })

  it("missingGlampingFields marca lo que falta", () => {
    expect([...missingGlampingFields(defaultGlampingDetail())].sort()).toEqual(["accommodation_type", "capacity", "min_nights", "price_per_night"])
    expect(missingGlampingFields({ accommodation_type: "domo", capacity: "2", price_per_night: "10", min_nights: "0" }).size).toBe(0)
  })
})
