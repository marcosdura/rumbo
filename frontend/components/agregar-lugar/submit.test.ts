import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Failure } from "./submit"

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
vi.mock("@/lib/uploadImage", () => ({
  uploadImageToCloudinary: () => Promise.resolve({ publicId: "rumbo/spots/1/abc", url: "https://res.cloudinary.com/x.jpg" }),
}))
const ok = (is_approved: boolean, id = 1) => () => Promise.resolve({ data: { id, is_approved } })
const fail = () => Promise.reject(new Error("500"))
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }))

const { submitNewTrekkingRoute, submitNewClimbingSector, submitNewClimbingRoute, submitAgregarLugar, retryFailures } = await import("./submit")
const constants = await import("./constants")

let failures: Failure[] = []
function handlers() {
  return { setSubmitting: vi.fn(), setError: vi.fn(), setSuccess: vi.fn(), setFailures: (f: Failure[]) => { failures = f } }
}

const route = { name: "Sendero" } as never
const climbingRoute = { name: "La Diagonal", grade: "6a" } as never
const sector = { name: "Sector Norte" } as never
const urls = () => calls.map(c => c[0])

beforeEach(() => {
  responses = []
  calls = []
  failures = []
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

  it("el sector manda aproximación, sol y roca; vacío = no sé (null)", async () => {
    responses = [ok(false, 9)]
    const h = handlers()
    const sec = { ...constants.defaultSector(), name: "Placa", approach_minutes: "30", sun_exposure: "sol" }
    await submitNewClimbingSector({ climbingSpotId: 4, token: "t", sectors: [sec], sectorRoutes: [], ...h })
    expect(calls[0][1]).toMatchObject({ approach_minutes: 30, sun_exposure: "sol", rock_type: null })
  })

  it("sector sugerido: el resultado es el del sector", async () => {
    responses = [ok(false, 9), ok(false)]  // sector, vía
    const h = handlers()
    await submitNewClimbingSector({ climbingSpotId: 4, token: "t", sectors: [sector], sectorRoutes: [climbingRoute], ...h })
    expect(calls[1][1]).toMatchObject({ sector_id: 9 })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
    expect(failures).toEqual([])
  })

  it("vía nueva en un sector existente", async () => {
    responses = [ok(false)]
    const h = handlers()
    await submitNewClimbingRoute({ climbingSectorId: 9, token: "t", climbingNewRoutes: [climbingRoute], ...h })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
  })

  it("si el backend rechaza, muestra error y no éxito", async () => {
    responses = [fail]
    const h = handlers()
    await submitNewTrekkingRoute({ trekkingSpotId: 4, token: "t", routes: [route], ...h })
    expect(h.setSuccess).not.toHaveBeenCalled()
    expect(h.setError).toHaveBeenCalledWith("No se pudo guardar la ruta. Intentá de nuevo.")
    expect(h.setSubmitting).toHaveBeenLastCalledWith(false)
  })
})

describe("si falla una parte, se avisa y se reintenta sin duplicar", () => {
  it("dos rutas y falla la segunda: éxito, aviso con su nombre y el reintento solo manda esa", async () => {
    responses = [ok(false), fail]
    const h = handlers()
    await submitNewTrekkingRoute({ trekkingSpotId: 4, token: "t", routes: [{ name: "A" }, { name: "B" }] as never, ...h })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
    expect(failures.map(f => f.label)).toEqual(["Ruta «B»"])

    calls = []
    responses = [ok(false)]
    expect(await retryFailures(failures)).toEqual([])
    expect(calls).toHaveLength(1)
    expect(calls[0][1]).toMatchObject({ name: "B" })
  })

  it("se crea el sector y falla una vía: no se vuelve a crear el sector al reintentar", async () => {
    responses = [ok(false, 9), fail]
    const h = handlers()
    await submitNewClimbingSector({ climbingSpotId: 4, token: "t", sectors: [sector], sectorRoutes: [climbingRoute], ...h })
    expect(h.setSuccess).toHaveBeenCalledWith("pending")
    expect(failures.map(f => f.label)).toEqual(["Vías del sector «Sector Norte»"])

    calls = []
    responses = [ok(false)]
    await retryFailures(failures)
    expect(urls()).toEqual(["/climbingroutes/"])
    expect(calls[0][1]).toMatchObject({ sector_id: 9 })
  })

  it("si falla el sector, no se creó nada: error común para volver a enviar", async () => {
    responses = [fail]
    const h = handlers()
    await submitNewClimbingSector({ climbingSpotId: 4, token: "t", sectors: [sector], sectorRoutes: [], ...h })
    expect(h.setSuccess).not.toHaveBeenCalled()
    expect(h.setError).toHaveBeenCalledWith("No se pudo guardar el sector. Intentá de nuevo.")
  })

  it("lugar nuevo de escalada: si falla un sector, el lugar se envía igual y se avisa", async () => {
    responses = [ok(false, 30), ok(true), fail]  // lugar, foto, sector
    const h = handlers()
    await submitAgregarLugar({
      selectedCat: constants.CATEGORIES.find(c => c.name === "Escalada")!,
      isService: false, creatingNewSpot: false, token: "t",
      basic: { ...constants.emptyBasic(), name: "Arequita", lat: "-34", lng: "-55", pets_allowed: true, cell_signal: false },
      isPublic: null, publicTransport: null, isResponsible: false, selectedAmenities: [], additionalCategories: [],
      motorhomeDetail: constants.defaultMotorhomeDetail(), campingDetail: constants.defaultCampingDetail(),
      glampingDetail: constants.defaultGlampingDetail(), glampingUnits: [],
      selectedGlampingAmenities: [], selectedCampingAmenities: [],
      trekkingFeatures: constants.defaultTrekkingFeatures(), routes: [],
      sectors: [{ ...constants.defaultSector(), name: "Norte" }], sectorRoutes: [],
      surf: constants.defaultSurf(), kayaks: [], images: [new File(["x"], "a.jpg")],
      surfPhotoFiles: [null, null, null], kayakPhotoFiles: [null, null, null],
      selectedSpotId: null, ownerEmail: "a@b.com", experiences: [],
      setUploadProgress: () => {}, ...h,
    })
    expect(h.setSuccess).toHaveBeenCalledWith("spot")
    expect(failures.map(f => f.label)).toEqual(["Sector «Norte» y sus vías"])
    expect(urls().filter(u => u === "/spots")).toHaveLength(1)
    // Lo cargó como visitante: el backend lo pasa al admin al aprobarlo.
    expect(calls[0][1]).toMatchObject({ is_responsible: false })
    // Información práctica: lo que no se sabe va null.
    expect(calls[0][1]).toMatchObject({ pets_allowed: true, cell_signal: false, reservation_required: null })

    calls = []
    responses = [ok(false, 40)]
    await retryFailures(failures)
    expect(urls()).toEqual(["/sectors/"])
    expect(calls[0][1]).toMatchObject({ spot_id: 30, name: "Norte" })
  })

  it("la escuela manda niveles e idiomas, y el kayak guía y chaleco (null = no sé)", async () => {
    const base = {
      isService: true, creatingNewSpot: false, token: "t", basic: constants.emptyBasic(),
      isPublic: null, publicTransport: null, isResponsible: true, selectedAmenities: [], additionalCategories: [],
      motorhomeDetail: constants.defaultMotorhomeDetail(), campingDetail: constants.defaultCampingDetail(),
      glampingDetail: constants.defaultGlampingDetail(), glampingUnits: [],
      selectedGlampingAmenities: [], selectedCampingAmenities: [],
      trekkingFeatures: constants.defaultTrekkingFeatures(), routes: [], sectors: [], sectorRoutes: [],
      images: [], selectedSpotId: 3, ownerEmail: "a@b.com", experiences: [],
      setUploadProgress: () => {},
    }
    const cover = [new File(["x"], "a.jpg"), null, null]
    responses = [ok(false)]
    await submitAgregarLugar({
      ...base, ...handlers(), selectedCat: constants.CATEGORIES.find(c => c.name === "Surf")!,
      surf: { ...constants.defaultSurf(), name: "Ola", levels: ["principiante"] }, kayaks: [],
      surfPhotoFiles: cover, kayakPhotoFiles: [null, null, null],
    })
    expect(calls[0][1]).toMatchObject({ levels: ["principiante"], languages: null })

    calls = []
    responses = [ok(false)]
    await submitAgregarLugar({
      ...base, ...handlers(), selectedCat: constants.CATEGORIES.find(c => c.name === "Kayak")!,
      surf: constants.defaultSurf(), kayaks: [{ ...constants.defaultKayak(), name: "Sur", includes_guide: true }],
      surfPhotoFiles: [null, null, null], kayakPhotoFiles: cover,
    })
    expect(calls[0][1]).toMatchObject({ includes_guide: true, includes_life_jacket: null })
  })
})
