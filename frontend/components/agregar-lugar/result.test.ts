import { describe, expect, it } from "vitest"
import { RESULT_COPY, contributionResult, mySpotsFor } from "./result"

describe("contributionResult", () => {
  it("si algo quedó sin aprobar, el envío está en revisión", () => {
    expect(contributionResult([{ is_approved: true }, { is_approved: false }])).toBe("pending")
  })

  it("si todo se publicó, es publicado", () => {
    expect(contributionResult([{ is_approved: true }])).toBe("published")
  })

  it("sin dato de aprobación no asume revisión", () => {
    expect(contributionResult([{}])).toBe("published")
  })
})

describe("mySpotsFor", () => {
  const spots = [
    { id: 1, name: "Playa Brava", activities: ["Surf", "Camping"] },
    { id: 2, name: "Laguna", activities: ["Kayak"] },
    { id: 3, name: "Sin actividades" },
  ]

  it("ofrece solo los lugares propios con esa actividad", () => {
    expect(mySpotsFor(spots, "Surf")).toEqual([{ id: 1, name: "Playa Brava" }])
    expect(mySpotsFor(spots, "Kayak")).toEqual([{ id: 2, name: "Laguna" }])
    expect(mySpotsFor(spots, "Trekking")).toEqual([])
  })
})

describe("RESULT_COPY", () => {
  it("el aviso de revisión dice dónde seguir el estado", () => {
    expect(RESULT_COPY.pending.text).toMatch(/en revisión/)
    expect(RESULT_COPY.pending.text).toMatch(/perfil/)
  })
})
