import { describe, expect, it } from "vitest"
import { asSpotChangeRequest, describeOperatorFields, formFromOperator, operatorPayload, photosOf, type Operator } from "./operator"

const surf: Operator = {
  id: 1, kind: "surf_school", name: "Escuela Ola", is_approved: true,
  spot: { id: 3, name: "Playa Brava", slug: "playa-brava", is_approved: true },
  contribution_id: null, change_request: null,
  photo_1: "https://a", photo_2: null, photo_3: "https://c",
  duration: 1.5, email: null, whatsapp: "099", instagram: null, season_start: 11, season_end: 3,
  class_type: "grupal", equipment_include: true,
}

describe("operator", () => {
  it("photosOf saltea los huecos", () => {
    expect(photosOf(surf)).toEqual(["https://a", "https://c"])
  })

  it("formFromOperator + operatorPayload ida y vuelta (escuela de surf)", () => {
    const payload = operatorPayload("surf_school", formFromOperator(surf), ["https://a"])
    expect(payload).toEqual({
      name: "Escuela Ola", duration: 1.5, email: null, whatsapp: "099", instagram: null,
      season_start: 11, season_end: 3, photos: ["https://a"],
      class_type: "grupal", equipment_include: true,
    })
  })

  it("kayak manda sus propios campos y no los de surf", () => {
    const form = { ...formFromOperator(surf), water_type: "lago", seasonal: false }
    const payload = operatorPayload("kayak", form, [])
    expect(payload).toMatchObject({ water_type: "lago", season_start: null, season_end: null })
    expect(payload).not.toHaveProperty("class_type")
  })

  it("describeOperatorFields", () => {
    expect(describeOperatorFields(["name", "photos"])).toBe("nombre y fotos")
    expect(describeOperatorFields(["season_start", "season_end", "whatsapp"])).toBe("temporada y WhatsApp")
  })

  it("asSpotChangeRequest muestra solo las fotos nuevas", () => {
    const req = asSpotChangeRequest({
      id: 9, status: "pending", reject_reason: null, created_at: null, resolved_at: null,
      changes: { name: { from: "A", to: "B" }, photos: { from: ["https://a"], to: ["https://a", "https://n"] } },
    })
    expect(req.changes).toEqual({ name: { from: "A", to: "B" }, photos_added: ["https://n"] })
  })
})
