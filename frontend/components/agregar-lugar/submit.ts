import type { Category, BasicInfo, TrekkingFeatures, RouteItem, SectorItem, SurfItem, KayakItem } from "./types"

export function buildPublicId(category: string, spotName: string, index: number): string {
  const formatted = spotName
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_")
  return `${category}/${formatted}/${formatted}${index + 1}`
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
  trekkingFeatures: TrekkingFeatures
  routes: RouteItem[]
  sectors: SectorItem[]
  surf: SurfItem
  kayaks: KayakItem[]
  images: File[]
  surfPhotoFiles: (File | null)[]
  kayakPhotoFiles: (File | null)[]
  selectedSpotId: number | null
  ownerEmail: string | null
  setSubmitting: (v: boolean) => void
  setUploadProgress: (v: string | null) => void
  setError: (v: string | null) => void
  setSuccess: (v: boolean) => void
}

export async function submitAgregarLugar(params: SubmitParams): Promise<void> {
  const {
    selectedCat, isService, creatingNewSpot, token, basic, isPublic, publicTransport,
    selectedAmenities, trekkingFeatures, routes, sectors, surf, kayaks,
    images, surfPhotoFiles, kayakPhotoFiles, selectedSpotId, ownerEmail,
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
            whatsapp: basic.whatsapp || null,
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
            const fd = new FormData()
            fd.append("file", file)
            fd.append("public_id", buildPublicId(selectedCat.name, basic.name, i))
            const res = await fetch("/api/upload/upload", { method: "POST", body: fd })
            if (!res.ok) throw new Error("Error al subir imagen")
            const data = await res.json()
            return { publicId: data.public_id, index: i }
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
          const fd = new FormData()
          fd.append("file", file)
          const safeName = surf.name.trim().replace(/\s+/g, "_")
          fd.append("public_id", `Surf/${safeName}/${safeName}_photo_${i + 1}`)
          const uploadRes = await fetch("/api/upload/upload", { method: "POST", body: fd })
          if (!uploadRes.ok) throw new Error("Error al subir la foto")
          const uploadData = await uploadRes.json()
          photoUrls[i] = uploadData.url
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
          const fd = new FormData()
          fd.append("file", file)
          const safeName = kayaks[0]?.name.trim().replace(/\s+/g, "_") || "kayak"
          fd.append("public_id", `Kayak/${safeName}/${safeName}_photo_${i + 1}`)
          const uploadRes = await fetch("/api/upload/upload", { method: "POST", body: fd })
          if (!uploadRes.ok) throw new Error("Error al subir la foto")
          const uploadData = await uploadRes.json()
          kayakPhotoUrls[i] = uploadData.url
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
        const fd = new FormData()
        fd.append("file", file)
        fd.append("public_id", buildPublicId(selectedCat.name, basic.name, i))
        const res = await fetch("/api/upload/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error("Error al subir imagen")
        const data = await res.json()
        return { publicId: data.public_id, index: i }
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
        whatsapp:     basic.whatsapp  || null,
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/camping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ price: basic.price ? parseFloat(basic.price) : null }),
      })
    }

    if (cat === "Glamping") {
      const glampRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glamping/spots/${spotId}/glamping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      })
      if (glampRes.ok) {
        const glampData = await glampRes.json()
        const glampingId: number = glampData.id

        const GLAMPING_AMENITY_MAP: Record<string, string> = {
          "Baño privado":       "private_bathroom",
          "Electricidad":       "electricity",
          "WiFi":               "wifi",
          "Desayuno incluido":  "breakfast_included",
          "Acepta mascotas":    "pet_friendly",
          "Calefacción":        "heating",
          "Aire acondicionado": "air_conditioning",
          "Cocina equipada":    "kitchen",
          "Ropa de cama":       "towels_included",
          "Estacionamiento":    "parking",
        }
        const amenityPayload: Record<string, boolean> = {}
        for (const name of selectedAmenities) {
          const field = GLAMPING_AMENITY_MAP[name]
          if (field) amenityPayload[field] = true
        }
        if (Object.keys(amenityPayload).length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glamping/glamping/${glampingId}/amenities`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(amenityPayload),
          })
        }
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
      for (const sec of sectors) {
        if (!sec.name) continue
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectors/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: spotId, name: sec.name,
            type: sec.type || null,
            max_altitude: sec.max_altitude ? parseInt(sec.max_altitude) : null,
            restrictions: sec.restrictions || null,
          }),
        })
      }
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

    setSuccess(true)
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Error inesperado")
  } finally {
    setSubmitting(false)
    setUploadProgress(null)
  }
}
