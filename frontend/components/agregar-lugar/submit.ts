import type { Category, BasicInfo, TrekkingFeatures, RouteItem, SectorItem, SurfItem, KayakItem, MotorhomeDetailItem, CampingDetailItem, GlampingDetailItem, ClimbingRouteItem, ExperienceItem } from "./types"
import { GLAMPING_AMENITY_MAP, PHONE_COUNTRIES, EXPERIENCE_SCHEDULE_OPTIONS, normalizePhoneDigits } from "./constants"
import { uploadImageToCloudinary } from "@/lib/uploadImage"

function formatWhatsapp(basic: BasicInfo): string | null {
  if (!basic.whatsapp.trim()) return null
  const country = PHONE_COUNTRIES.find(c => c.code === basic.whatsappCountry) ?? PHONE_COUNTRIES[0]
  return `+${country.dial} ${normalizePhoneDigits(basic.whatsapp.trim(), country)}`
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
        const spotRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
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
          }),
        })
        if (!spotRes.ok) throw new Error("Error al crear el lugar")
        const spotData = await spotRes.json()
        spotId = spotData.id

        setUploadProgress("Subiendo imágenes del lugar...")
        const uploadResults = await Promise.all(
          images.map(async (file, i) => {
            const { publicId } = await uploadImageToCloudinary(file, {
              category: selectedCat.name,
              spotName: basic.name,
              index: i,
            })
            return { publicId, index: i }
          })
        )

        await Promise.all(
          uploadResults.map(({ publicId, index }) => {
            const urlParams = new URLSearchParams({
              cloudinary_public_id: publicId,
              is_main: String(index === 0),
              order: String(index),
            })
            return fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${spotId}?${urlParams}`, {
              method: "POST",
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            })
          })
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
          })
          photoUrls[i] = url
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surfschool/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            spot_id: spotId,
            name: surf.name,
            class_type: surf.class_type || null,
            duration: surf.duration ? parseFloat(surf.duration) : null,
            equipment_include: surf.equipment_include,
            season_start: surf.season_type === "seasonal" && surf.season_start ? parseInt(surf.season_start) : null,
            season_end:   surf.season_type === "seasonal" && surf.season_end   ? parseInt(surf.season_end)   : null,
            email: surf.email || null, whatsapp: surf.whatsapp || null, instagram: surf.instagram || null,
            photo_1: photoUrls[0], photo_2: photoUrls[1] ?? null, photo_3: photoUrls[2] ?? null,
          }),
        })
        if (!res.ok) throw new Error("Error al guardar la escuelita")
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
          })
          kayakPhotoUrls[i] = url
        }

        for (const k of kayaks) {
          if (!k.name) continue
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kayak/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              spot_id: spotId,
              name: k.name,
              water_type: k.water_type || null, difficulty: k.difficulty || null,
              duration: k.duration ? parseFloat(k.duration) : null,
              kayak_type: k.kayak_type || null, rental_available: k.rental_available,
              season_start: k.season_type === "seasonal" && k.season_start ? parseInt(k.season_start) : null,
              season_end:   k.season_type === "seasonal" && k.season_end   ? parseInt(k.season_end)   : null,
              email: k.email || null, whatsapp: k.whatsapp || null, instagram: k.instagram || null,
              photo_1: kayakPhotoUrls[0], photo_2: kayakPhotoUrls[1] ?? null, photo_3: kayakPhotoUrls[2] ?? null,
            }),
          })
        }
      }
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
    // 1. Upload images en paralelo
    setUploadProgress("Subiendo imágenes...")
    const uploadResults = await Promise.all(
      images.map(async (file, i) => {
        const { publicId } = await uploadImageToCloudinary(file, {
          category: selectedCat.name,
          spotName: basic.name,
          index: i,
        })
        return { publicId, index: i }
      })
    )

    // 2. Create spot
    setUploadProgress("Guardando lugar...")
    const seasonStart = basic.season_type === "seasonal" && basic.season_start ? parseInt(basic.season_start) : null
    const seasonEnd   = basic.season_type === "seasonal" && basic.season_end   ? parseInt(basic.season_end)   : null
    const spotRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
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
      }),
    })
    if (!spotRes.ok) throw new Error("Error al crear el lugar")
    const spot = await spotRes.json()
    const spotId: number = spot.id

    // 3. Add images en paralelo
    await Promise.all(
      uploadResults.map(({ publicId, index }) => {
        const urlParams = new URLSearchParams({
          cloudinary_public_id: publicId,
          is_main: String(index === 0),
          order: String(index),
        })
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${spotId}?${urlParams}`, {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
      })
    )

    // 4. Category-specific records
    if (cat === "Camping" && selectedAmenities.length > 0) {
      const amenRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/amenities/`)
      if (amenRes.ok) {
        const all: { id: number; name: string }[] = await amenRes.json()
        const nameToId = Object.fromEntries(all.map(a => [a.name, a.id]))
        for (const name of selectedAmenities) {
          const id = nameToId[name]
          if (id) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/amenities/${id}`, { method: "POST" })
          }
        }
      }
    }

    if (cat === "Camping") {
      const campingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/camping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ price: basic.price ? parseFloat(basic.price) : null }),
      })
      if (!campingRes.ok) throw new Error("Error al guardar los datos del camping")
    }

    if (cat === "Glamping") {
      for (const unit of glampingUnits) {
        if (!unit.accommodation_type && !unit.capacity && !unit.price_per_night && !unit.min_nights) continue
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glamping/spots/${spotId}/glamping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            accommodation_type: unit.accommodation_type || null,
            capacity: unit.capacity ? parseInt(unit.capacity) : null,
            price_per_night: unit.price_per_night ? parseFloat(unit.price_per_night) : null,
            min_nights: unit.min_nights ? parseInt(unit.min_nights) : null,
          }),
        })
      }

      const amenityPayload: Record<string, boolean> = {}
      for (const name of selectedAmenities) {
        const field = GLAMPING_AMENITY_MAP[name]
        if (field) amenityPayload[field] = true
      }
      if (Object.keys(amenityPayload).length > 0) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glamping/spots/${spotId}/amenities`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(amenityPayload),
        })
      }
    }

    if ((cat === "Camping" || cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Motorhome")) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            category: "Motorhome",
            motorhome_detail: {
              capacity: motorhomeDetail.capacity ? parseInt(motorhomeDetail.capacity) : null,
              surface_type: motorhomeDetail.surface_type || null,
              has_water: motorhomeDetail.has_water,
              has_electricity: motorhomeDetail.has_electricity,
              has_dump_station: motorhomeDetail.has_dump_station,
              max_stay_nights: motorhomeDetail.max_stay_nights ? parseInt(motorhomeDetail.max_stay_nights) : null,
            },
          }),
        })
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
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              category: "Glamping",
              glamping_detail: {
                accommodation_type: unit.accommodation_type || null,
                capacity: unit.capacity ? parseInt(unit.capacity) : null,
                price_per_night: unit.price_per_night ? parseFloat(unit.price_per_night) : null,
                min_nights: unit.min_nights ? parseInt(unit.min_nights) : null,
              },
              glamping_amenities: i === 0 && Object.keys(amenityPayload).length > 0 ? amenityPayload : null,
            }),
          })
        } catch {
          // No bloquear el éxito de la creación del spot si esto falla
        }
      }
    }

    if ((cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Camping")) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            category: "Camping",
            camping_detail: {
              price: campingDetail.price ? parseFloat(campingDetail.price) : null,
            },
          }),
        })
      } catch {
        // No bloquear el éxito de la creación del spot si esto falla
      }
    }

    if ((cat === "Glamping" || cat === "Motorhome") && additionalCategories.includes("Camping") && selectedCampingAmenities.length > 0) {
      try {
        const amenRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/amenities/`)
        if (amenRes.ok) {
          const all: { id: number; name: string }[] = await amenRes.json()
          const nameToId = Object.fromEntries(all.map(a => [a.name, a.id]))
          for (const name of selectedCampingAmenities) {
            const id = nameToId[name]
            if (id) {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/amenities/${id}`, { method: "POST" })
            }
          }
        }
      } catch {
        // No bloquear el éxito de la creación del spot si esto falla
      }
    }

    if (cat === "Trekking") {
      for (const r of routes) {
        if (!r.name) continue
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/routes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: spotId, name: r.name,
            distance_km:    r.distance_km    ? parseFloat(r.distance_km)    : null,
            duration_hours: r.duration_hours ? parseFloat(r.duration_hours) : null,
            elevation_gain: r.elevation_gain ? parseInt(r.elevation_gain)   : null,
            elevation_loss: r.elevation_loss ? parseInt(r.elevation_loss)   : null,
            max_altitude:   r.max_altitude   ? parseInt(r.max_altitude)     : null,
            min_altitude:   r.min_altitude   ? parseInt(r.min_altitude)     : null,
            difficulty: r.difficulty || null, route_type: r.route_type || null,
            technical_level: r.technical_level || null, physical_demand: r.physical_demand || null,
          }),
        })
      }
      const hasFeatures = Object.values(trekkingFeatures).some(v => v !== null)
      if (hasFeatures) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/trekking-detail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trekkingFeatures),
        })
      }
    }

    if (cat === "Escalada") {
      const createdSectorIds: (number | null)[] = []
      for (const sec of sectors) {
        if (!sec.name) { createdSectorIds.push(null); continue }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectors/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: spotId, name: sec.name,
            type: sec.type || null,
            max_altitude: sec.max_altitude ? parseInt(sec.max_altitude) : null,
            restrictions: sec.restrictions || null,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          createdSectorIds.push(data.id)
        } else {
          createdSectorIds.push(null)
        }
      }

      for (const r of sectorRoutes) {
        if (!r.name) continue
        const sectorId = createdSectorIds[r.sectorIndex]
        if (!sectorId) continue
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/climbingroutes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: r.name,
            grade: r.grade || null,
            type: r.type || null,
            length: r.length_m ? parseInt(r.length_m) : null,
            bolts: r.bolts ? parseInt(r.bolts) : null,
            description: r.description || null,
            sector_id: sectorId,
          }),
        })
      }
    }

    if (cat === "Motorhome") {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/motorhome`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          capacity: motorhomeDetail.capacity ? parseInt(motorhomeDetail.capacity) : null,
          surface_type: motorhomeDetail.surface_type || null,
          has_water: motorhomeDetail.has_water,
          has_electricity: motorhomeDetail.has_electricity,
          has_dump_station: motorhomeDetail.has_dump_station,
          max_stay_nights: motorhomeDetail.max_stay_nights ? parseInt(motorhomeDetail.max_stay_nights) : null,
        }),
      })
    }

    if (cat === "Surf" && surf.name) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surfschool/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: spotId, name: surf.name,
          class_type: surf.class_type || null,
          duration: surf.duration ? parseFloat(surf.duration) : null,
          equipment_include: surf.equipment_include,
          season_start: surf.season_type === "seasonal" && surf.season_start ? parseInt(surf.season_start) : null,
          season_end:   surf.season_type === "seasonal" && surf.season_end   ? parseInt(surf.season_end)   : null,
          email: surf.email || null, whatsapp: surf.whatsapp || null, instagram: surf.instagram || null,
        }),
      })
    }

    if (cat === "Kayak") {
      for (const k of kayaks) {
        if (!k.name) continue
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kayak/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: spotId, name: k.name,
            water_type: k.water_type || null, difficulty: k.difficulty || null,
            duration: k.duration ? parseFloat(k.duration) : null,
            kayak_type: k.kayak_type || null, rental_available: k.rental_available,
            season_start: k.season_type === "seasonal" && k.season_start ? parseInt(k.season_start) : null,
            season_end:   k.season_type === "seasonal" && k.season_end   ? parseInt(k.season_end)   : null,
            email: k.email || null, whatsapp: k.whatsapp || null, instagram: k.instagram || null,
          }),
        })
      }
    }

    for (const exp of experiences) {
      if (!exp.title.trim() || !exp.category_id) continue
      const scheduleValue = exp.schedule_type === "personalizado"
        ? exp.schedule_custom.trim() || null
        : exp.schedule_type
          ? EXPERIENCE_SCHEDULE_OPTIONS.find(o => o.value === exp.schedule_type)?.label ?? null
          : null
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/experiences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          category_id: parseInt(exp.category_id),
          title: exp.title.trim(),
          description: exp.description.trim() || null,
          price: exp.price ? parseFloat(exp.price) : null,
          currency: "UYU",
          schedule: scheduleValue,
          contact: exp.contact.trim() || null,
        }),
      })
    }

    setSuccess(true)
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Error inesperado")
  } finally {
    setSubmitting(false)
    setUploadProgress(null)
  }
}
