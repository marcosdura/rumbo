import type { Category, BasicInfo, TrekkingFeatures, RouteItem, SectorItem, SurfItem, KayakItem, MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem, ClimbingRouteItem, ExperienceItem } from "./types"
import { GLAMPING_AMENITY_MAP, PHONE_COUNTRIES, EXPERIENCE_SCHEDULE_OPTIONS, normalizePhoneDigits } from "./constants"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import { trackEvent } from "@/lib/analytics"
import { api } from "@/lib/api"

function formatWhatsapp(basic: BasicInfo): string | null {
  if (!basic.whatsapp.trim()) return null
  const country = PHONE_COUNTRIES.find(c => c.code === basic.whatsappCountry) ?? PHONE_COUNTRIES[0]
  return `+${country.dial} ${normalizePhoneDigits(basic.whatsapp.trim(), country)}`
}

// ─── Submits "especiales" ──────────────────────────────────────────────────
// Los 3 flujos de "agregar contenido a un spot existente" (ruta de trekking
// nueva / sector de escalada nuevo / ruta de escalada nueva) no crean un
// spot — solo el/los sub-recursos. Viven acá junto al resto de la lógica de
// envío, no en el componente, mismo criterio que submitAgregarLugar.

interface SubmitNewTrekkingRouteParams {
  trekkingSpotId: number | null
  token: string | undefined
  routes: RouteItem[]
  setSubmitting: (v: boolean) => void
  setError: (v: string | null) => void
  setSuccess: (v: boolean) => void
}

export async function submitNewTrekkingRoute(params: SubmitNewTrekkingRouteParams): Promise<void> {
  const { trekkingSpotId, token, routes, setSubmitting, setError, setSuccess } = params
  setSubmitting(true)
  setError(null)
  try {
    for (const r of routes) {
      if (!r.name) continue
      await api.post("/routes/", {
        spot_id: trekkingSpotId,
        name: r.name,
        distance_km: r.distance_km ? parseFloat(r.distance_km) : null,
        duration_hours: r.duration_hours ? parseFloat(r.duration_hours) : null,
        elevation_gain: r.elevation_gain ? parseInt(r.elevation_gain) : null,
        elevation_loss: r.elevation_loss ? parseInt(r.elevation_loss) : null,
        max_altitude: r.max_altitude ? parseInt(r.max_altitude) : null,
        min_altitude: r.min_altitude ? parseInt(r.min_altitude) : null,
        difficulty: r.difficulty || null,
        route_type: r.route_type || null,
        technical_level: r.technical_level || null,
        physical_demand: r.physical_demand || null,
      }, { token })
    }
    setSuccess(true)
  } catch {
    setError("No se pudo guardar la ruta. Intentá de nuevo.")
  } finally {
    setSubmitting(false)
  }
}

interface SubmitNewClimbingSectorParams {
  climbingSpotId: number | null
  token: string | undefined
  sectors: SectorItem[]
  sectorRoutes: ClimbingRouteItem[]
  setSubmitting: (v: boolean) => void
  setError: (v: string | null) => void
  setSuccess: (v: boolean) => void
}

export async function submitNewClimbingSector(params: SubmitNewClimbingSectorParams): Promise<void> {
  const { climbingSpotId, token, sectors, sectorRoutes, setSubmitting, setError, setSuccess } = params
  setSubmitting(true)
  setError(null)
  try {
    const sec = sectors[0]
    const { data: newSector } = await api.post<{ id: number }>("/sectors/", {
      name: sec.name,
      type: sec.type || null,
      max_altitude: sec.max_altitude ? parseInt(sec.max_altitude) : null,
      restrictions: sec.restrictions || null,
      spot_id: climbingSpotId,
    }, { token })

    for (const r of sectorRoutes) {
      if (!r.name) continue
      await api.post("/climbingroutes/", {
        name: r.name,
        grade: r.grade || null,
        type: r.type || null,
        length: r.length_m ? parseInt(r.length_m) : null,
        bolts: r.bolts ? parseInt(r.bolts) : null,
        description: r.description || null,
        sector_id: newSector.id,
      }, { token })
    }
    setSuccess(true)
  } catch {
    setError("No se pudo guardar el sector. Intentá de nuevo.")
  } finally {
    setSubmitting(false)
  }
}

interface SubmitNewClimbingRouteParams {
  climbingSectorId: number | null
  token: string | undefined
  climbingNewRoutes: ClimbingRouteItem[]
  setSubmitting: (v: boolean) => void
  setError: (v: string | null) => void
  setSuccess: (v: boolean) => void
}

export async function submitNewClimbingRoute(params: SubmitNewClimbingRouteParams): Promise<void> {
  const { climbingSectorId, token, climbingNewRoutes, setSubmitting, setError, setSuccess } = params
  setSubmitting(true)
  setError(null)
  try {
    for (const r of climbingNewRoutes) {
      if (!r.name) continue
      await api.post("/climbingroutes/", {
        name: r.name,
        grade: r.grade || null,
        type: r.type || null,
        length: r.length_m ? parseInt(r.length_m) : null,
        bolts: r.bolts ? parseInt(r.bolts) : null,
        description: r.description || null,
        sector_id: climbingSectorId,
      }, { token })
    }
    setSuccess(true)
  } catch {
    setError("No se pudo guardar la ruta. Intentá de nuevo.")
  } finally {
    setSubmitting(false)
  }
}

interface SubmitParams {
  selectedCat: Category
  isService: boolean
  creatingNewSpot: boolean
  token: string | undefined
  basic: BasicInfo
  isPublic: boolean | null
  publicTransport: string | null
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
  setSuccess: (v: boolean) => void
}

export async function submitAgregarLugar(params: SubmitParams): Promise<void> {
  const {
    selectedCat, isService, creatingNewSpot, token, basic, isPublic, publicTransport,
    selectedAmenities, additionalCategories, motorhomeDetail, campingDetail, glampingDetail, glampingUnits,
    selectedGlampingAmenities, selectedCampingAmenities, trekkingFeatures, routes, sectors, sectorRoutes, surf, kayaks,
    images, surfPhotoFiles, kayakPhotoFiles, selectedSpotId, ownerEmail, experiences,
    setSubmitting, setUploadProgress, setError, setSuccess,
  } = params

  const cat = selectedCat.name

  if (isService) {
    setError(null)
    setSubmitting(true)
    try {
      let spotId = selectedSpotId

      if (creatingNewSpot) {
        setUploadProgress("Guardando lugar...")
        const { data: spotData } = await api.post<{ id: number }>("/spots", {
          name: basic.name,
          description: basic.description,
          department: basic.department,
          category_id: selectedCat.id,
          email: basic.email || null,
          whatsapp: formatWhatsapp(basic),
          instagram: basic.instagram || null,
          price: basic.price ? parseInt(basic.price) : null,
          lat: basic.lat ? parseFloat(basic.lat) : null,
          lng: basic.lng ? parseFloat(basic.lng) : null,
          owner_email: ownerEmail,
          is_approved: false,
          is_public: isPublic,
          public_transport: publicTransport,
          season_start: basic.season_type === "seasonal" && basic.season_start ? parseInt(basic.season_start) : null,
          season_end: basic.season_type === "seasonal" && basic.season_end ? parseInt(basic.season_end) : null,
        }, { token })
        spotId = spotData.id

        setUploadProgress("Subiendo imágenes del lugar...")
        const uploadResults = await Promise.all(
          images.map(async (file, i) => {
            const { publicId } = await uploadImageToCloudinary(file, {
              category: selectedCat.name,
              spotName: basic.name,
              index: i,
              spotId: spotId as number,
            })
            return { publicId, index: i }
          })
        )

        await Promise.all(
          uploadResults.map(({ publicId, index }) =>
            api.post(`/images/spots/${spotId}`, undefined, {
              token,
              params: { cloudinary_public_id: publicId, is_main: index === 0, order: index },
            }).catch(() => {})
          )
        )
      }

      if (cat === "Surf" && surf.name) {
        if (!creatingNewSpot && !surfPhotoFiles[0]) { setError("La foto de portada es obligatoria."); setSubmitting(false); return }

        const photoUrls: (string | null)[] = [null, null, null]
        const photoLabels = ["foto de portada", "foto adicional 2", "foto adicional 3"]
        for (let i = 0; i < 3; i++) {
          const file = surfPhotoFiles[i]
          if (!file) continue
          setUploadProgress(`Subiendo ${photoLabels[i]}...`)
          const { url } = await uploadImageToCloudinary(file, {
            category: "Surf",
            spotName: surf.name,
            index: i,
            spotId: spotId as number,
          })
          photoUrls[i] = url
        }

        await api.post("/surfschool/", {
          spot_id: spotId,
          name: surf.name,
          class_type: surf.class_type || null,
          duration: surf.duration ? parseFloat(surf.duration) : null,
          equipment_include: surf.equipment_include,
          season_start: surf.season_type === "seasonal" && surf.season_start ? parseInt(surf.season_start) : null,
          season_end:   surf.season_type === "seasonal" && surf.season_end   ? parseInt(surf.season_end)   : null,
          email: surf.email || null, whatsapp: surf.whatsapp || null, instagram: surf.instagram || null,
          photo_1: photoUrls[0], photo_2: photoUrls[1] ?? null, photo_3: photoUrls[2] ?? null,
        }, { token })
      }
      if (cat === "Kayak") {
        if (!creatingNewSpot && !kayakPhotoFiles[0]) { setError("La foto de portada es obligatoria."); setSubmitting(false); return }

        const kayakPhotoUrls: (string | null)[] = [null, null, null]
        const photoLabels = ["foto de portada", "foto adicional 2", "foto adicional 3"]
        for (let i = 0; i < 3; i++) {
          const file = kayakPhotoFiles[i]
          if (!file) continue
          setUploadProgress(`Subiendo ${photoLabels[i]}...`)
          const { url } = await uploadImageToCloudinary(file, {
            category: "Kayak",
            spotName: kayaks[0]?.name || "kayak",
            index: i,
            spotId: spotId as number,
          })
          kayakPhotoUrls[i] = url
        }

        for (const k of kayaks) {
          if (!k.name) continue
          await api.post("/kayak/", {
            spot_id: spotId,
            name: k.name,
            water_type: k.water_type || null, difficulty: k.difficulty || null,
            duration: k.duration ? parseFloat(k.duration) : null,
            kayak_type: k.kayak_type || null, rental_available: k.rental_available,
            season_start: k.season_type === "seasonal" && k.season_start ? parseInt(k.season_start) : null,
            season_end:   k.season_type === "seasonal" && k.season_end   ? parseInt(k.season_end)   : null,
            email: k.email || null, whatsapp: k.whatsapp || null, instagram: k.instagram || null,
            photo_1: kayakPhotoUrls[0], photo_2: kayakPhotoUrls[1] ?? null, photo_3: kayakPhotoUrls[2] ?? null,
          }, { token }).catch(() => {})
        }
      }
      trackEvent("add_spot_complete", { category: cat, creating_new_spot: creatingNewSpot })
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado")
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
    return
  }

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
    const seasonStart = basic.season_type === "seasonal" && basic.season_start ? parseInt(basic.season_start) : null
    const seasonEnd   = basic.season_type === "seasonal" && basic.season_end   ? parseInt(basic.season_end)   : null
    const { data: spot } = await api.post<{ id: number }>("/spots", {
      name:         basic.name,
      description:  basic.description,
      department:   basic.department,
      category_id:  selectedCat.id,
      owner_email:  ownerEmail,
      is_approved:  false,
      price:        basic.price ? parseInt(basic.price) : null,
      season_start: seasonStart,
      season_end:   seasonEnd,
      email:        basic.email     || null,
      whatsapp:     formatWhatsapp(basic),
      instagram:    basic.instagram || null,
      lat:          basic.lat ? parseFloat(basic.lat) : null,
      lng:          basic.lng ? parseFloat(basic.lng) : null,
      is_public:        isPublic,
      public_transport: publicTransport,
    }, { token })
    const spotId: number = spot.id

    // 2. Upload images en paralelo
    setUploadProgress("Subiendo imágenes...")
    const uploadResults = await Promise.all(
      images.map(async (file, i) => {
        const { publicId } = await uploadImageToCloudinary(file, {
          category: selectedCat.name,
          spotName: basic.name,
          index: i,
          spotId,
        })
        return { publicId, index: i }
      })
    )

    // 3. Add images en paralelo
    await Promise.all(
      uploadResults.map(({ publicId, index }) =>
        api.post(`/images/spots/${spotId}`, undefined, {
          token,
          params: { cloudinary_public_id: publicId, is_main: index === 0, order: index },
        }).catch(() => {})
      )
    )

    // 4. Category-specific records
    if (cat === "Camping" && selectedAmenities.length > 0) {
      try {
        const { data: all } = await api.get<{ id: number; name: string }[]>("/amenities/")
        const nameToId = Object.fromEntries(all.map(a => [a.name, a.id]))
        for (const name of selectedAmenities) {
          const id = nameToId[name]
          if (id) {
            await api.post(`/spots/${spotId}/amenities/${id}`, undefined, { token }).catch(() => {})
          }
        }
      } catch {
        // no bloquea el submit si falla
      }
    }

    if (cat === "Camping") {
      await api.post(`/spots/${spotId}/camping`, { price: basic.price ? parseFloat(basic.price) : null }, { token })
    }

    if (cat === "Glamping") {
      for (const unit of glampingUnits) {
        if (!unit.accommodation_type && !unit.capacity && !unit.price_per_night && !unit.min_nights) continue
        await api.post(`/glamping/spots/${spotId}/glamping`, {
          accommodation_type: unit.accommodation_type || null,
          capacity: unit.capacity ? parseInt(unit.capacity) : null,
          price_per_night: unit.price_per_night ? parseFloat(unit.price_per_night) : null,
          min_nights: unit.min_nights ? parseInt(unit.min_nights) : null,
        }, { token }).catch(() => {})
      }

      const amenityPayload: Record<string, boolean> = {}
      for (const name of selectedAmenities) {
        const field = GLAMPING_AMENITY_MAP[name]
        if (field) amenityPayload[field] = true
      }
      if (Object.keys(amenityPayload).length > 0) {
        await api.post(`/glamping/spots/${spotId}/amenities`, amenityPayload, { token }).catch(() => {})
      }
    }

    if ((cat === "Camping" || cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Motorhome")) {
      try {
        await api.post(`/spots/${spotId}/categories`, {
          category: "Motorhome",
          motorhome_detail: {
            capacity: motorhomeDetail.capacity ? parseInt(motorhomeDetail.capacity) : null,
            surface_type: motorhomeDetail.surface_type || null,
            has_water: motorhomeDetail.has_water,
            has_electricity: motorhomeDetail.has_electricity,
            has_dump_station: motorhomeDetail.has_dump_station,
            max_stay_nights: motorhomeDetail.max_stay_nights ? parseInt(motorhomeDetail.max_stay_nights) : null,
          },
        }, { token })
      } catch {
        // no bloquea el submit si falla el alta de la categoría adicional
      }
    }

    if ((cat === "Camping" || cat === "Motorhome") && additionalCategories.includes("Glamping")) {
      const amenityPayload: Record<string, boolean> = {}
      for (const name of selectedGlampingAmenities) {
        const field = GLAMPING_AMENITY_MAP[name]
        if (field) amenityPayload[field] = true
      }

      for (let i = 0; i < glampingUnits.length; i++) {
        const unit = glampingUnits[i]
        try {
          await api.post(`/spots/${spotId}/categories`, {
            category: "Glamping",
            glamping_detail: {
              accommodation_type: unit.accommodation_type || null,
              capacity: unit.capacity ? parseInt(unit.capacity) : null,
              price_per_night: unit.price_per_night ? parseFloat(unit.price_per_night) : null,
              min_nights: unit.min_nights ? parseInt(unit.min_nights) : null,
            },
            glamping_amenities: i === 0 && Object.keys(amenityPayload).length > 0 ? amenityPayload : null,
          }, { token })
        } catch {
          // No bloquear el éxito de la creación del spot si esto falla
        }
      }
    }

    if ((cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Camping")) {
      try {
        await api.post(`/spots/${spotId}/categories`, {
          category: "Camping",
          camping_detail: {
            price: campingDetail.price ? parseFloat(campingDetail.price) : null,
          },
        }, { token })
      } catch {
        // No bloquear el éxito de la creación del spot si esto falla
      }
    }

    if ((cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Camping") && selectedCampingAmenities.length > 0) {
      try {
        const { data: all } = await api.get<{ id: number; name: string }[]>("/amenities/")
        const nameToId = Object.fromEntries(all.map(a => [a.name, a.id]))
        for (const name of selectedCampingAmenities) {
          const id = nameToId[name]
          if (id) {
            await api.post(`/spots/${spotId}/amenities/${id}`, undefined, { token }).catch(() => {})
          }
        }
      } catch {
        // No bloquear el éxito de la creación del spot si esto falla
      }
    }

    if (cat === "Trekking") {
      for (const r of routes) {
        if (!r.name) continue
        await api.post("/routes/", {
          spot_id: spotId, name: r.name,
          distance_km:    r.distance_km    ? parseFloat(r.distance_km)    : null,
          duration_hours: r.duration_hours ? parseFloat(r.duration_hours) : null,
          elevation_gain: r.elevation_gain ? parseInt(r.elevation_gain)   : null,
          elevation_loss: r.elevation_loss ? parseInt(r.elevation_loss)   : null,
          max_altitude:   r.max_altitude   ? parseInt(r.max_altitude)     : null,
          min_altitude:   r.min_altitude   ? parseInt(r.min_altitude)     : null,
          difficulty: r.difficulty || null, route_type: r.route_type || null,
          technical_level: r.technical_level || null, physical_demand: r.physical_demand || null,
        }, { token }).catch(() => {})
      }
      const hasFeatures = Object.values(trekkingFeatures).some(v => v !== null)
      if (hasFeatures) {
        await api.post(`/spots/${spotId}/trekking-detail`, trekkingFeatures, { token }).catch(() => {})
      }
    }

    if (cat === "Escalada") {
      const createdSectorIds: (number | null)[] = []
      for (const sec of sectors) {
        if (!sec.name) { createdSectorIds.push(null); continue }
        try {
          const { data } = await api.post<{ id: number }>("/sectors/", {
            spot_id: spotId, name: sec.name,
            type: sec.type || null,
            max_altitude: sec.max_altitude ? parseInt(sec.max_altitude) : null,
            restrictions: sec.restrictions || null,
          }, { token })
          createdSectorIds.push(data.id)
        } catch {
          createdSectorIds.push(null)
        }
      }

      for (const r of sectorRoutes) {
        if (!r.name) continue
        const sectorId = createdSectorIds[r.sectorIndex]
        if (!sectorId) continue
        await api.post("/climbingroutes/", {
          name: r.name,
          grade: r.grade || null,
          type: r.type || null,
          length: r.length_m ? parseInt(r.length_m) : null,
          bolts: r.bolts ? parseInt(r.bolts) : null,
          description: r.description || null,
          sector_id: sectorId,
        }, { token }).catch(() => {})
      }
    }

    if (cat === "Motorhome") {
      await api.post(`/spots/${spotId}/motorhome`, {
        capacity: motorhomeDetail.capacity ? parseInt(motorhomeDetail.capacity) : null,
        surface_type: motorhomeDetail.surface_type || null,
        has_water: motorhomeDetail.has_water,
        has_electricity: motorhomeDetail.has_electricity,
        has_dump_station: motorhomeDetail.has_dump_station,
        max_stay_nights: motorhomeDetail.max_stay_nights ? parseInt(motorhomeDetail.max_stay_nights) : null,
      }, { token }).catch(() => {})
    }

    if (cat === "Surf" && surf.name) {
      await api.post("/surfschool/", {
        spot_id: spotId, name: surf.name,
        class_type: surf.class_type || null,
        duration: surf.duration ? parseFloat(surf.duration) : null,
        equipment_include: surf.equipment_include,
        season_start: surf.season_type === "seasonal" && surf.season_start ? parseInt(surf.season_start) : null,
        season_end:   surf.season_type === "seasonal" && surf.season_end   ? parseInt(surf.season_end)   : null,
        email: surf.email || null, whatsapp: surf.whatsapp || null, instagram: surf.instagram || null,
      }, { token }).catch(() => {})
    }

    if (cat === "Kayak") {
      for (const k of kayaks) {
        if (!k.name) continue
        await api.post("/kayak/", {
          spot_id: spotId, name: k.name,
          water_type: k.water_type || null, difficulty: k.difficulty || null,
          duration: k.duration ? parseFloat(k.duration) : null,
          kayak_type: k.kayak_type || null, rental_available: k.rental_available,
          season_start: k.season_type === "seasonal" && k.season_start ? parseInt(k.season_start) : null,
          season_end:   k.season_type === "seasonal" && k.season_end   ? parseInt(k.season_end)   : null,
          email: k.email || null, whatsapp: k.whatsapp || null, instagram: k.instagram || null,
        }, { token }).catch(() => {})
      }
    }

    for (const exp of experiences) {
      if (!exp.title.trim() || !exp.category_id) continue
      const scheduleValue = exp.schedule_type === "personalizado"
        ? exp.schedule_custom.trim() || null
        : exp.schedule_type
          ? EXPERIENCE_SCHEDULE_OPTIONS.find(o => o.value === exp.schedule_type)?.label ?? null
          : null
      await api.post(`/spots/${spotId}/experiences`, {
        category_id: parseInt(exp.category_id),
        title: exp.title.trim(),
        description: exp.description.trim() || null,
        price: exp.price ? parseFloat(exp.price) : null,
        currency: "UYU",
        schedule: scheduleValue,
        contact: exp.contact.trim() || null,
      }, { token }).catch(() => {})
    }

    trackEvent("add_spot_complete", { category: cat, creating_new_spot: true })
    setSuccess(true)
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Error inesperado")
  } finally {
    setSubmitting(false)
    setUploadProgress(null)
  }
}
