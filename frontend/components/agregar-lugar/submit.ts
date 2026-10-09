import { contributionResult, type SubmitResult } from "./result"
import { experiencePayload, glampingUnitPayload } from "./payloads"
import type { Category, BasicInfo, TrekkingFeatures, RouteItem, SectorItem, SurfItem, KayakItem, OperatorAbout, MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem, ClimbingRouteItem, ExperienceItem } from "./types"
import { GLAMPING_AMENITY_MAP, PHONE_COUNTRIES, normalizePhoneDigits } from "./constants"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import { trackEvent } from "@/lib/analytics"
import { api } from "@/lib/api"
import type { PhotoTarget } from "@/lib/trailPage"

function formatWhatsapp(basic: BasicInfo): string | null {
  if (!basic.whatsapp.trim()) return null
  const country = PHONE_COUNTRIES.find(c => c.code === basic.whatsappCountry) ?? PHONE_COUNTRIES[0]
  return `+${country.dial} ${normalizePhoneDigits(basic.whatsapp.trim(), country)}`
}

// ─── Lo que falla después de crear algo ────────────────────────────────────
// Una vez creado el lugar (o el sector), lo que sigue (fotos, rutas,
// sectores, vías, comodidades...) puede fallar por separado. Antes esos
// errores se descartaban en silencio, o cortaban todo con un error y al
// reintentar se duplicaba el lugar. Ahora cada parte es una tarea que se
// puede retomar: si falla, se avisa con su nombre y "Reintentar" sigue desde
// donde quedó, sin volver a crear lo que ya se creó.

export type Failure = { label: string; retry: () => Promise<void> }

async function attempt(failures: Failure[], label: string, task: () => Promise<unknown>) {
  const run = async () => { await task() }
  try {
    await run()
  } catch {
    failures.push({ label, retry: run })
  }
}

// Reintenta lo que había fallado; devuelve lo que sigue fallando.
export async function retryFailures(failures: Failure[]): Promise<Failure[]> {
  const still: Failure[] = []
  for (const f of failures) {
    try {
      await f.retry()
    } catch {
      still.push(f)
    }
  }
  return still
}

type Created = { id: number; is_approved?: boolean }

export function routePayload(r: RouteItem) {
  return {
    name: r.name,
    distance_km:    r.distance_km    ? parseFloat(r.distance_km)    : null,
    duration_hours: r.duration_hours ? parseFloat(r.duration_hours) : null,
    elevation_gain: r.elevation_gain ? parseInt(r.elevation_gain)   : null,
    elevation_loss: r.elevation_loss ? parseInt(r.elevation_loss)   : null,
    max_altitude:   r.max_altitude   ? parseInt(r.max_altitude)     : null,
    min_altitude:   r.min_altitude   ? parseInt(r.min_altitude)     : null,
    difficulty: r.difficulty || null, route_type: r.route_type || null,
    technical_level: r.technical_level || null, physical_demand: r.physical_demand || null,
    // ?? "": un borrador guardado antes de que existiera el campo no lo trae.
    description: (r.description ?? "").trim() || null,
  }
}

function climbingRoutePayload(r: ClimbingRouteItem, sectorId: number) {
  return {
    name: r.name,
    grade: r.grade || null,
    type: r.type || null,
    length: r.length_m ? parseInt(r.length_m) : null,
    bolts: r.bolts ? parseInt(r.bolts) : null,
    description: r.description || null,
    sector_id: sectorId,
  }
}

function sectorPayload(sec: SectorItem, spotId: number) {
  return {
    spot_id: spotId, name: sec.name,
    type: sec.type || null,
    max_altitude: sec.max_altitude ? parseInt(sec.max_altitude) : null,
    restrictions: sec.restrictions || null,
    // Vacío = "no sé".
    approach_minutes: sec.approach_minutes ? parseInt(sec.approach_minutes) : null,
    sun_exposure: sec.sun_exposure || null,
    rock_type: sec.rock_type || null,
  }
}

// Un sector con sus vías. Si falla una vía, reintentar no vuelve a crear el
// sector ni las vías que ya se guardaron.
function sectorTask(sec: SectorItem, routes: ClimbingRouteItem[], spotId: number, token: string | undefined) {
  let sector: Created | null = null
  // Índice de la vía -> id creado (para subir sus fotos).
  const done = new Map<number, number>()
  const task = async () => {
    if (!sector) sector = (await api.post<Created>("/sectors/", sectorPayload(sec, spotId), { token })).data
    for (const [i, r] of routes.entries()) {
      if (done.has(i)) continue
      const { data } = await api.post<Created>("/climbingroutes/", climbingRoutePayload(r, sector.id), { token })
      done.set(i, data.id)
    }
  }
  return { task, created: () => sector, viaId: (i: number) => done.get(i) }
}

// Las fotos del sector y de cada vía, después de crearlos.
async function addSectorPhotos(
  failures: Failure[], sec: SectorItem, routes: ClimbingRouteItem[],
  t: ReturnType<typeof sectorTask>, spotId: number, token: string | undefined,
) {
  await addItemPhotos(failures, `Fotos del sector «${sec.name}»`, sec.photos, "climbing_sector", () => t.created()?.id, spotId, token)
  for (const [i, r] of routes.entries()) {
    await addItemPhotos(failures, `Fotos de la vía «${r.name}»`, r.photos, "climbing_route", () => t.viaId(i), spotId, token)
  }
}

// Las fotos de una ruta, sector o vía recién creada (backend/item_photos.py):
// se suben a la carpeta del lugar y se registran juntas; pasan por revisión.
// Si se subieron y falló el registro, reintentar no las vuelve a subir. Si
// todavía no se creó la ruta (falló antes), falla y se reintenta después.
export function itemPhotosTask(files: File[], target: PhotoTarget, itemId: () => number | null | undefined, spotId: number, token: string | undefined) {
  const uploaded: (string | null)[] = files.map(() => null)
  let posted = false
  return async () => {
    const id = itemId()
    if (!id) throw new Error("Todavía no se creó")
    for (const [i, file] of files.entries()) {
      if (!uploaded[i]) uploaded[i] = (await uploadImageToCloudinary(file, { spotId })).publicId
    }
    if (!posted) {
      await api.post("/photos", { target, target_id: id, public_ids: uploaded }, { token })
      posted = true
    }
  }
}

async function addItemPhotos(
  failures: Failure[], label: string, files: File[] | undefined, target: PhotoTarget,
  itemId: () => number | null | undefined, spotId: number, token: string | undefined,
) {
  if (!files?.length) return
  await attempt(failures, label, itemPhotosTask(files, target, itemId, spotId, token))
}

// Una foto del lugar: subirla a Cloudinary y registrarla. Si ya se subió y
// falló el registro, reintentar no la vuelve a subir.
function imageTask(file: File, index: number, spotId: number, token: string | undefined) {
  let publicId: string | null = null
  return async () => {
    if (!publicId) publicId = (await uploadImageToCloudinary(file, { spotId })).publicId
    await api.post(`/images/spots/${spotId}`, undefined, {
      token,
      params: { cloudinary_public_id: publicId, is_main: index === 0, order: index },
    })
  }
}

async function addImages(failures: Failure[], images: File[], spotId: number, token: string | undefined) {
  await Promise.all(images.map((file, i) =>
    attempt(failures, images.length > 1 ? `Foto ${i + 1}` : "La foto", imageTask(file, i, spotId, token))))
}

// ─── Submits "especiales" ──────────────────────────────────────────────────
// Los 3 flujos de "agregar contenido a un spot existente" (ruta de trekking
// nueva / sector de escalada nuevo / ruta de escalada nueva) no crean un
// spot — solo el/los sub-recursos. Viven acá junto al resto de la lógica de
// envío, no en el componente, mismo criterio que submitAgregarLugar.

interface ContributionHandlers {
  setSubmitting: (v: boolean) => void
  setError: (v: string | null) => void
  setSuccess: (v: SubmitResult) => void
  setFailures: (f: Failure[]) => void
}

// Varias cosas independientes (rutas, vías): las que se guardaron cuentan;
// si no se guardó ninguna, es un error común y se puede volver a enviar.
async function submitEach<T extends { photos?: File[] }>(
  items: T[], label: (item: T) => string, post: (item: T) => Promise<Created>,
  noneMessage: string, failMessage: string, h: ContributionHandlers,
  // Las fotos de cada una, después de crearla.
  photos?: { target: PhotoTarget; spotId: number; token: string | undefined },
) {
  h.setSubmitting(true)
  h.setError(null)
  try {
    const created: Created[] = []
    const failures: Failure[] = []
    for (const item of items) {
      let id: number | null = null
      await attempt(failures, label(item), async () => { const c = await post(item); created.push(c); id = c.id })
      if (photos) await addItemPhotos(failures, `Fotos de ${label(item)}`, item.photos, photos.target, () => id, photos.spotId, photos.token)
    }
    if (items.length === 0) { h.setError(noneMessage); return }
    if (created.length === 0) { h.setError(failMessage); return }
    h.setFailures(failures)
    h.setSuccess(contributionResult(created))
  } finally {
    h.setSubmitting(false)
  }
}

interface SubmitNewTrekkingRouteParams extends ContributionHandlers {
  trekkingSpotId: number | null
  token: string | undefined
  routes: RouteItem[]
}

export async function submitNewTrekkingRoute(params: SubmitNewTrekkingRouteParams): Promise<void> {
  const { trekkingSpotId, token, routes } = params
  await submitEach(
    routes.filter(r => r.name.trim()),
    r => `Ruta «${r.name}»`,
    async r => (await api.post<Created>("/routes/", { spot_id: trekkingSpotId, ...routePayload(r) }, { token })).data,
    "Agregá al menos una ruta.",
    "No se pudo guardar la ruta. Intentá de nuevo.",
    params,
    { target: "trekking_route", spotId: trekkingSpotId as number, token },
  )
}

interface SubmitNewClimbingSectorParams extends ContributionHandlers {
  climbingSpotId: number | null
  token: string | undefined
  sectors: SectorItem[]
  sectorRoutes: ClimbingRouteItem[]
}

export async function submitNewClimbingSector(params: SubmitNewClimbingSectorParams): Promise<void> {
  const { climbingSpotId, token, sectors, sectorRoutes, setSubmitting, setError, setSuccess, setFailures } = params
  setSubmitting(true)
  setError(null)
  try {
    const vias = sectorRoutes.filter(r => r.name)
    const t = sectorTask(sectors[0], vias, climbingSpotId as number, token)
    const failures: Failure[] = []
    await attempt(failures, `Vías del sector «${sectors[0].name}»`, t.task)
    const sector = t.created()
    // Sin sector no se guardó nada: se puede volver a enviar tal cual.
    if (!sector) { setError("No se pudo guardar el sector. Intentá de nuevo."); return }
    await addSectorPhotos(failures, sectors[0], vias, t, climbingSpotId as number, token)
    setFailures(failures)
    // Las vías van con el sector: si el sector quedó en revisión, ellas también.
    setSuccess(contributionResult([sector]))
  } finally {
    setSubmitting(false)
  }
}

interface SubmitNewClimbingRouteParams extends ContributionHandlers {
  // El lugar del sector: la carpeta de las fotos.
  climbingSpotId: number | null
  climbingSectorId: number | null
  token: string | undefined
  climbingNewRoutes: ClimbingRouteItem[]
}

export async function submitNewClimbingRoute(params: SubmitNewClimbingRouteParams): Promise<void> {
  const { climbingSpotId, climbingSectorId, token, climbingNewRoutes } = params
  await submitEach(
    climbingNewRoutes.filter(r => r.name.trim()),
    r => `Vía «${r.name}»`,
    async r => (await api.post<Created>("/climbingroutes/", climbingRoutePayload(r, climbingSectorId as number), { token })).data,
    "Agregá al menos una vía.",
    "No se pudieron guardar las vías. Intentá de nuevo.",
    params,
    { target: "climbing_route", spotId: climbingSpotId as number, token },
  )
}

interface SubmitParams {
  selectedCat: Category
  isService: boolean
  creatingNewSpot: boolean
  token: string | undefined
  basic: BasicInfo
  isPublic: boolean | null
  publicTransport: string | null
  // False: lo carga un visitante; aprobado, pasa al admin.
  isResponsible: boolean
  selectedAmenities: string[]
  additionalCategories: string[]
  motorhomeDetail: MotorhomeDetailItem
  campingDetail: CampingDetailItem
  glampingDetail: GlampingDetailItem
  glampingUnits: GlampingDetailItem[]
  selectedGlampingAmenities: string[]
  selectedCampingAmenities: string[]
  trekkingFeatures: TrekkingFeatures
  routes: RouteItem[]
  sectors: SectorItem[]
  sectorRoutes: ClimbingRouteItem[]
  surf: SurfItem
  kayaks: KayakItem[]
  images: File[]
  surfPhotoFiles: (File | null)[]
  kayakPhotoFiles: (File | null)[]
  selectedSpotId: number | null
  ownerEmail: string | null
  experiences: ExperienceItem[]
  setSubmitting: (v: boolean) => void
  setUploadProgress: (v: string | null) => void
  setError: (v: string | null) => void
  setSuccess: (v: SubmitResult) => void
  setFailures: (f: Failure[]) => void
}

function spotPayload(p: SubmitParams) {
  const { basic, selectedCat, ownerEmail, isPublic, publicTransport, isResponsible } = p
  return {
    name:         basic.name,
    description:  basic.description,
    department:   basic.department,
    category_id:  selectedCat.id,
    owner_email:  ownerEmail,
    is_approved:  false,
    price:        basic.price ? parseInt(basic.price) : null,
    season_start: basic.season_type === "seasonal" && basic.season_start ? parseInt(basic.season_start) : null,
    season_end:   basic.season_type === "seasonal" && basic.season_end   ? parseInt(basic.season_end)   : null,
    email:        basic.email     || null,
    whatsapp:     formatWhatsapp(basic),
    instagram:    basic.instagram || null,
    lat:          basic.lat ? parseFloat(basic.lat) : null,
    lng:          basic.lng ? parseFloat(basic.lng) : null,
    is_public:        isPublic,
    public_transport: publicTransport,
    is_responsible:   isResponsible,
    pets_allowed:         basic.pets_allowed,
    reservation_required: basic.reservation_required,
    cell_signal:          basic.cell_signal,
  }
}

// Las fotos de una escuela o un servicio: se suben antes de crearlo (van como
// URL en photo_1..3). Las que ya se subieron no se vuelven a subir.
function operatorPhotos(files: (File | null)[], spotId: number, setUploadProgress: (v: string | null) => void) {
  const urls: (string | null)[] = [null, null, null]
  const labels = ["foto de portada", "foto adicional 2", "foto adicional 3"]
  return async () => {
    for (let i = 0; i < 3; i++) {
      const file = files[i]
      if (!file || urls[i]) continue
      setUploadProgress(`Subiendo ${labels[i]}...`)
      urls[i] = (await uploadImageToCloudinary(file, { spotId })).url
    }
    return { photo_1: urls[0], photo_2: urls[1] ?? null, photo_3: urls[2] ?? null }
  }
}

// Descripción y precio, igual para escuelas y servicios.
export function aboutPayload(a: OperatorAbout) {
  return {
    // ?? "": un borrador guardado antes de que existieran no los trae.
    description: (a.description ?? "").trim() || null,
    price_from: a.price_from ? parseInt(a.price_from) : null,
    price_note: (a.price_note ?? "").trim() || null,
  }
}

export function surfPayload(surf: SurfItem) {
  return {
    name: surf.name,
    class_type: surf.class_type || null,
    duration: surf.duration ? parseFloat(surf.duration) : null,
    equipment_include: surf.equipment_include,
    season_start: surf.season_type === "seasonal" && surf.season_start ? parseInt(surf.season_start) : null,
    season_end:   surf.season_type === "seasonal" && surf.season_end   ? parseInt(surf.season_end)   : null,
    email: surf.email || null, whatsapp: surf.whatsapp || null, instagram: surf.instagram || null,
    // null = no sé.
    levels: surf.levels, languages: surf.languages,
    ...aboutPayload(surf),
  }
}

export function kayakPayload(k: KayakItem) {
  return {
    name: k.name,
    water_type: k.water_type || null, difficulty: k.difficulty || null,
    duration: k.duration ? parseFloat(k.duration) : null,
    kayak_type: k.kayak_type || null, rental_available: k.rental_available,
    season_start: k.season_type === "seasonal" && k.season_start ? parseInt(k.season_start) : null,
    season_end:   k.season_type === "seasonal" && k.season_end   ? parseInt(k.season_end)   : null,
    email: k.email || null, whatsapp: k.whatsapp || null, instagram: k.instagram || null,
    includes_guide: k.includes_guide, includes_life_jacket: k.includes_life_jacket,
    ...aboutPayload(k),
  }
}

// Escuela de surf o servicio de kayak (con sus fotos) para la playa spotId.
function operatorTasks(p: SubmitParams, spotId: number, created: Created[]): { label: string; task: () => Promise<void> }[] {
  const { selectedCat, surf, kayaks, surfPhotoFiles, kayakPhotoFiles, token, setUploadProgress } = p
  if (selectedCat.name === "Surf") {
    if (!surf.name) return []
    const photos = operatorPhotos(surfPhotoFiles, spotId, setUploadProgress)
    return [{
      label: `Escuela «${surf.name}»`,
      task: async () => {
        const { data } = await api.post<Created>("/surfschool/", { spot_id: spotId, ...surfPayload(surf), ...(await photos()) }, { token })
        created.push(data)
      },
    }]
  }
  // Las fotos son una sola tanda para el servicio.
  const photos = operatorPhotos(kayakPhotoFiles, spotId, setUploadProgress)
  return kayaks.filter(k => k.name).map(k => ({
    label: `Servicio «${k.name}»`,
    task: async () => {
      const { data } = await api.post<Created>("/kayak/", { spot_id: spotId, ...kayakPayload(k), ...(await photos()) }, { token })
      created.push(data)
    },
  }))
}

async function submitService(p: SubmitParams): Promise<void> {
  const { creatingNewSpot, selectedCat, surfPhotoFiles, kayakPhotoFiles, selectedSpotId, images, token,
    setSubmitting, setUploadProgress, setError, setSuccess, setFailures } = p
  const coverMissing = selectedCat.name === "Surf" ? !surfPhotoFiles[0] : !kayakPhotoFiles[0]
  if (!creatingNewSpot && coverMissing) { setError("La foto de portada es obligatoria."); return }

  setError(null)
  setSubmitting(true)
  try {
    const created: Created[] = []
    if (!creatingNewSpot) {
      // A una playa existente: si falla, no se creó nada y se puede reenviar.
      for (const { task } of operatorTasks(p, selectedSpotId as number, created)) await task()
      trackEvent("add_spot_complete", { category: selectedCat.name, creating_new_spot: false })
      setSuccess(contributionResult(created))
      return
    }

    setUploadProgress("Guardando lugar...")
    const { data: spot } = await api.post<{ id: number }>("/spots", spotPayload(p), { token })
    // Desde acá la playa ya existe: lo que falle se avisa y se reintenta.
    const failures: Failure[] = []
    setUploadProgress("Subiendo imágenes del lugar...")
    await addImages(failures, images, spot.id, token)
    for (const { label, task } of operatorTasks(p, spot.id, created)) await attempt(failures, label, task)
    trackEvent("add_spot_complete", { category: selectedCat.name, creating_new_spot: true })
    setFailures(failures)
    setSuccess("spot")
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Error inesperado")
  } finally {
    setSubmitting(false)
    setUploadProgress(null)
  }
}

// Ids de amenities por nombre (el catálogo es chico y se pide una vez).
async function amenityIds(names: string[]): Promise<number[]> {
  const { data: all } = await api.get<{ id: number; name: string }[]>("/amenities/")
  const nameToId = Object.fromEntries(all.map(a => [a.name, a.id]))
  return names.map(n => nameToId[n]).filter((id): id is number => !!id)
}

function glampingAmenityPayload(names: string[]): Record<string, boolean> {
  const payload: Record<string, boolean> = {}
  for (const name of names) {
    const field = GLAMPING_AMENITY_MAP[name]
    if (field) payload[field] = true
  }
  return payload
}

export async function submitAgregarLugar(params: SubmitParams): Promise<void> {
  if (params.isService) return submitService(params)

  const {
    selectedCat, token, basic, selectedAmenities, additionalCategories, motorhomeDetail, campingDetail, glampingUnits,
    selectedGlampingAmenities, selectedCampingAmenities, trekkingFeatures, routes, sectors, sectorRoutes,
    images, experiences, setSubmitting, setUploadProgress, setError, setSuccess, setFailures,
  } = params
  const cat = selectedCat.name

  if (!basic.lat || !basic.lng) { setError("La ubicación es obligatoria."); return }
  if (images.length === 0) { setError("Debés subir al menos una imagen."); return }
  setError(null)
  setSubmitting(true)

  try {
    // 1. Create spot — primero, para tener un spot_id real (y con
    // owner_email fijado server-side al usuario autenticado) antes de subir
    // ninguna imagen. La firma de Cloudinary exige ese spot_id para
    // verificar que el spot es del usuario antes de firmar.
    setUploadProgress("Guardando lugar...")
    const { data: spot } = await api.post<{ id: number }>("/spots", spotPayload(params), { token })
    const spotId: number = spot.id

    // Desde acá el lugar ya existe: cada parte que falle se avisa al final
    // y se puede reintentar.
    const failures: Failure[] = []
    const add = (label: string, task: () => Promise<unknown>) => attempt(failures, label, task)

    // 2. Imágenes en paralelo
    setUploadProgress("Subiendo imágenes...")
    await addImages(failures, images, spotId, token)

    // 3. Datos de cada categoría
    setUploadProgress("Guardando los detalles...")
    if (cat === "Camping") {
      await add("Precio del camping", () =>
        api.post(`/spots/${spotId}/camping`, { price: basic.price ? parseFloat(basic.price) : null }, { token }))
      if (selectedAmenities.length > 0) {
        await add("Servicios del camping", async () => {
          for (const id of await amenityIds(selectedAmenities)) {
            await api.post(`/spots/${spotId}/amenities/${id}`, undefined, { token })
          }
        })
      }
    }

    if (cat === "Glamping") {
      for (const [i, unit] of glampingUnits.entries()) {
        if (!unit.accommodation_type && !unit.capacity && !unit.price_per_night && !unit.min_nights) continue
        await add(`Alojamiento «${unit.accommodation_type || `Tipo ${i + 1}`}»`, () =>
          api.post(`/glamping/spots/${spotId}/glamping`, glampingUnitPayload(unit), { token }))
      }
      const amenityPayload = glampingAmenityPayload(selectedAmenities)
      if (Object.keys(amenityPayload).length > 0) {
        await add("Servicios del glamping", () => api.post(`/glamping/spots/${spotId}/amenities`, amenityPayload, { token }))
      }
    }

    if (cat === "Motorhome") {
      await add("Datos del área de motorhomes", () => api.post(`/spots/${spotId}/motorhome`, {
        capacity: motorhomeDetail.capacity ? parseInt(motorhomeDetail.capacity) : null,
        surface_type: motorhomeDetail.surface_type || null,
        has_water: motorhomeDetail.has_water,
        has_electricity: motorhomeDetail.has_electricity,
        has_dump_station: motorhomeDetail.has_dump_station,
        max_stay_nights: motorhomeDetail.max_stay_nights ? parseInt(motorhomeDetail.max_stay_nights) : null,
      }, { token }))
    }

    // 4. Categorías adicionales
    if ((cat === "Camping" || cat === "Glamping") && additionalCategories.includes("Motorhome")) {
      await add("Categoría adicional Motorhome", () => api.post(`/spots/${spotId}/categories`, {
        category: "Motorhome",
        motorhome_detail: {
          capacity: motorhomeDetail.capacity ? parseInt(motorhomeDetail.capacity) : null,
          surface_type: motorhomeDetail.surface_type || null,
          has_water: motorhomeDetail.has_water,
          has_electricity: motorhomeDetail.has_electricity,
          has_dump_station: motorhomeDetail.has_dump_station,
          max_stay_nights: motorhomeDetail.max_stay_nights ? parseInt(motorhomeDetail.max_stay_nights) : null,
        },
      }, { token }))
    }

    if ((cat === "Camping" || cat === "Motorhome") && additionalCategories.includes("Glamping")) {
      const amenityPayload = glampingAmenityPayload(selectedGlampingAmenities)
      for (const [i, unit] of glampingUnits.entries()) {
        await add(`Glamping: alojamiento «${unit.accommodation_type || `Tipo ${i + 1}`}»`, () => api.post(`/spots/${spotId}/categories`, {
          category: "Glamping",
          glamping_detail: {
            accommodation_type: unit.accommodation_type || null,
            capacity: unit.capacity ? parseInt(unit.capacity) : null,
            price_per_night: unit.price_per_night ? parseFloat(unit.price_per_night) : null,
            min_nights: unit.min_nights ? parseInt(unit.min_nights) : null,
          },
          glamping_amenities: i === 0 && Object.keys(amenityPayload).length > 0 ? amenityPayload : null,
        }, { token }))
      }
    }

    if ((cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Camping")) {
      await add("Categoría adicional Camping", () => api.post(`/spots/${spotId}/categories`, {
        category: "Camping",
        camping_detail: { price: campingDetail.price ? parseFloat(campingDetail.price) : null },
      }, { token }))
      if (selectedCampingAmenities.length > 0) {
        await add("Servicios del camping", async () => {
          for (const id of await amenityIds(selectedCampingAmenities)) {
            await api.post(`/spots/${spotId}/amenities/${id}`, undefined, { token })
          }
        })
      }
    }

    // 5. Trekking y escalada
    if (cat === "Trekking") {
      for (const r of routes) {
        if (!r.name) continue
        let routeId: number | null = null
        await add(`Ruta «${r.name}»`, async () => {
          if (!routeId) routeId = (await api.post<Created>("/routes/", { spot_id: spotId, ...routePayload(r) }, { token })).data.id
        })
        await addItemPhotos(failures, `Fotos de la ruta «${r.name}»`, r.photos, "trekking_route", () => routeId, spotId, token)
      }
      if (Object.values(trekkingFeatures).some(v => v !== null)) {
        await add("Características del lugar", () => api.post(`/spots/${spotId}/trekking-detail`, trekkingFeatures, { token }))
      }
    }

    if (cat === "Escalada") {
      for (const [i, sec] of sectors.entries()) {
        if (!sec.name) continue
        const vias = sectorRoutes.filter(r => r.name && r.sectorIndex === i)
        const t = sectorTask(sec, vias, spotId, token)
        await add(`Sector «${sec.name}» y sus vías`, t.task)
        await addSectorPhotos(failures, sec, vias, t, spotId, token)
      }
    }

    // 6. Experiencias
    for (const exp of experiences) {
      const payload = experiencePayload(exp)
      if (!payload) continue
      await add(`Experiencia «${exp.title}»`, () => api.post(`/spots/${spotId}/experiences`, payload, { token }))
    }

    trackEvent("add_spot_complete", { category: cat, creating_new_spot: true })
    setFailures(failures)
    setSuccess("spot")
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Error inesperado")
  } finally {
    setSubmitting(false)
    setUploadProgress(null)
  }
}
