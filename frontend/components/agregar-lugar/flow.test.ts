import { describe, expect, it } from "vitest"
import {
  ENTRY_STEP, canEdit, createsSpot, flowSteps, isComplete, nextStep, previousStep, stepLabel, stepProgress,
  type FlowInput,
} from "./flow"

const base: FlowInput = { category: null, climbingMode: null, trekkingMode: null, creatingNewSpot: false }
const flow = (over: Partial<FlowInput>) => flowSteps({ ...base, ...over })

describe("flowSteps", () => {
  it("cada flujo termina en el resumen", () => {
    const flows = [
      flow({ category: "Camping" }), flow({ category: "Glamping" }), flow({ category: "Motorhome" }),
      flow({ category: "Trekking", trekkingMode: "new_spot" }), flow({ category: "Trekking", trekkingMode: "new_route" }),
      flow({ category: "Escalada", climbingMode: "new_spot" }), flow({ category: "Escalada", climbingMode: "new_sector" }),
      flow({ category: "Escalada", climbingMode: "new_route" }),
      flow({ category: "Surf" }), flow({ category: "Kayak", creatingNewSpot: true }),
    ]
    for (const steps of flows) {
      expect(steps[0]).toBe("categoria")
      expect(isComplete(steps)).toBe(true)
      expect(new Set(steps).size).toBe(steps.length)
    }
  })

  it("las imágenes no las pide un aporte a un lugar existente", () => {
    expect(flow({ category: "Trekking", trekkingMode: "new_route" })).not.toContain("imagenes")
    expect(flow({ category: "Escalada", climbingMode: "new_sector" })).not.toContain("imagenes")
    expect(flow({ category: "Escalada", climbingMode: "new_route" })).not.toContain("imagenes")
    expect(flow({ category: "Surf" })).not.toContain("imagenes")
  })

  it("sin modo elegido el flujo todavía no está definido", () => {
    expect(isComplete(flow({ category: "Escalada" }))).toBe(false)
    expect(isComplete(flow({}))).toBe(false)
  })

  it("solo crea un lugar el flujo que pide sus datos", () => {
    expect(createsSpot(flow({ category: "Camping" }))).toBe(true)
    expect(createsSpot(flow({ category: "Surf", creatingNewSpot: true }))).toBe(true)
    expect(createsSpot(flow({ category: "Surf" }))).toBe(false)
    expect(createsSpot(flow({ category: "Escalada", climbingMode: "new_sector" }))).toBe(false)
  })
})

describe("navegación", () => {
  const glamping = flow({ category: "Glamping" })

  it("siguiente y anterior según la lista", () => {
    expect(nextStep(glamping, "glamping_unidades")).toBe("amenities")
    expect(previousStep(glamping, "experiencias", null)).toBe("amenities")
    expect(nextStep(glamping, "resumen")).toBeNull()
    expect(previousStep(glamping, "categoria", null)).toBeNull()
  })

  it("el número de paso", () => {
    expect(stepLabel(glamping, "categoria", null)).toBe("Paso 1 de 8")
    expect(stepLabel(glamping, "resumen", null)).toBe("Paso 8 de 8")
    expect(stepLabel(flow({ category: "Escalada" }), "modo", null)).toBe("Paso 2")
  })
})

describe("link directo", () => {
  const sector = flow({ category: "Escalada", climbingMode: "new_sector" })
  const entry = ENTRY_STEP.sector

  it("los pasos se cuentan desde el de entrada", () => {
    expect(stepLabel(sector, "sector_nuevo", entry)).toBe("Paso 1 de 3")
    expect(stepLabel(sector, "resumen", entry)).toBe("Paso 3 de 3")
  })

  it("desde el paso de entrada no hay anterior: no se puede ir a elegir otra cosa", () => {
    expect(previousStep(sector, "sector_nuevo", entry)).toBeNull()
    expect(previousStep(sector, "vias", entry)).toBe("sector_nuevo")
  })

  it("el resumen no deja editar el lugar elegido", () => {
    expect(canEdit(sector, "lugar", entry)).toBe(false)
    expect(canEdit(sector, "modo", entry)).toBe(false)
    expect(canEdit(sector, "sector_nuevo", entry)).toBe(true)
    expect(canEdit(sector, "lugar", null)).toBe(true)
  })

  it("cada link entra a un paso de su flujo", () => {
    expect(flow({ category: "Trekking", trekkingMode: "new_route" })).toContain(ENTRY_STEP.ruta)
    expect(flow({ category: "Escalada", climbingMode: "new_route" })).toContain(ENTRY_STEP.via)
    expect(flow({ category: "Surf" })).toContain(ENTRY_STEP.surf)
    expect(flow({ category: "Kayak" })).toContain(ENTRY_STEP.kayak)
  })
})

describe("stepProgress", () => {
  it("nombra los pasos y marca hechos, actual y pendientes", () => {
    const steps = flow({ category: "Kayak" })
    expect(stepProgress(steps, "servicio", null, "Kayak")).toEqual([
      { key: "categoria", label: "Categoría", state: "done" },
      { key: "lugar", label: "Lugar", state: "done" },
      { key: "servicio", label: "Servicio", state: "current" },
      { key: "resumen", label: "Revisar", state: "todo" },
    ])
  })

  it("con link directo empieza en el paso de entrada", () => {
    const steps = flow({ category: "Surf" })
    expect(stepProgress(steps, "servicio", ENTRY_STEP.surf, "Surf").map(i => i.label)).toEqual(["Escuela", "Revisar"])
  })
})
