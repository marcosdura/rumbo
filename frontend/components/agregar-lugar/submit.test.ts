import { beforeEach, describe, expect, it, vi } from "vitest"

// La API simulada es una función común y no un vi.fn: Vitest 4 sigue las
// promesas que devuelve un vi.fn y reporta la rechazada del test de error
// como "rechazo sin manejar", aunque el código la atrape.
type Response = { data: { id: number; is_approved?: boolean } }
let responses: (() => Promise<Response>)[] = []
let calls: unknown[][] = []
vi.mock("@/lib/api", () => ({
  api: {
    post: (...args: unknown[]) => {
      calls.push(args)
      return responses.shift()!()
    },
  },
}))
const ok = (is_approved: boolean, id = 1) => () => Promise.resolve({ data: { id, is_approved } })
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }))

const { submitNewTrekkingRoute, submitNewClimbingSector, submitNewClimbingRoute } = await import("./submit")

function handlers() {
  return { setSubmitting: vi.fn(), setError: vi.fn(), setSuccess: vi.fn() }
}

const route = { name: "Sendero" } as never
const climbingRoute = { name: "La Diagonal", grade: "6a" } as never
const sector = { name: "Sector Norte" } as never

beforeEach(() => {
  responses = []
  calls = []
})

describe("sumar a un lugar existente", () => {
  it("ruta de trekking en revisión", async () => {
    responses = [ok(false)]
    const h = handlers()
    await submitNewTrekkingRoute({ trekkingSpotId: 4, token: "t", routes: [route], ...h })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
  })

  it("ruta de trekking publicada directo (lugar propio sin aprobar)", async () => {
    responses = [ok(true)]
    const h = handlers()
    await submitNewTrekkingRoute({ trekkingSpotId: 4, token: "t", routes: [route], ...h })
    expect(h.setSuccess).toHaveBeenCalledWith("published")
  })

  it("sector sugerido: el resultado es el del sector", async () => {
    responses = [ok(false, 9), ok(false)]  // sector, vía
    const h = handlers()
    await submitNewClimbingSector({ climbingSpotId: 4, token: "t", sectors: [sector], sectorRoutes: [climbingRoute], ...h })
    expect(calls[1][1]).toMatchObject({ sector_id: 9 })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
  })

  it("vía nueva en un sector existente", async () => {
    responses = [ok(false)]
    const h = handlers()
    await submitNewClimbingRoute({ climbingSectorId: 9, token: "t", climbingNewRoutes: [climbingRoute], ...h })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
  })

  it("si el backend rechaza, muestra error y no éxito", async () => {
    responses = [() => Promise.reject(new Error("No autorizado"))]
    const h = handlers()
    await submitNewTrekkingRoute({ trekkingSpotId: 4, token: "t", routes: [route], ...h })
    expect(h.setSuccess).not.toHaveBeenCalled()
    expect(h.setError).toHaveBeenCalledWith("No se pudo guardar la ruta. Intentá de nuevo.")
    expect(h.setSubmitting).toHaveBeenLastCalledWith(false)
  })
})
