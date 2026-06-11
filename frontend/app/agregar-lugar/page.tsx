"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import type { CSSProperties } from "react"

const LocationPicker = dynamic(
  () => import("@/components/forms/LocationPicker"),
  { ssr: false }
)

// ---- Types ----
type Category = { id: number; name: string; label: string; emoji: string }
type TrekkingFeatureKey =
  | "bathrooms" | "potable_water" | "pet_friendly" | "kids_friendly"
  | "camping" | "parking" | "fire_pits" | "shelter" | "accessible" | "signal"
type TrekkingFeatures = Record<TrekkingFeatureKey, boolean | null>
type RouteItem = {
  name: string; distance_km: string; duration_hours: string
  elevation_gain: string; elevation_loss: string; max_altitude: string; min_altitude: string
  difficulty: string; route_type: string; technical_level: string; physical_demand: string
}
type SectorItem = { name: string; type: string; max_altitude: string; restrictions: string }
type SurfItem = {
  name: string; class_type: string; duration: string; equipment_include: boolean
  season_type: "all_year" | "seasonal"; season_start: string; season_end: string
  email: string; whatsapp: string; instagram: string
}
type KayakItem = {
  name: string; water_type: string; difficulty: string; duration: string; kayak_type: string
  rental_available: boolean
  season_type: "all_year" | "seasonal"; season_start: string; season_end: string
  email: string; whatsapp: string; instagram: string
}

// ---- Constants ----
const CATEGORIES: Category[] = [
  { id: 1, name: "Camping",  label: "Camping",  emoji: "⛺" },
  { id: 6, name: "Glamping", label: "Glamping", emoji: "🛖" },
  { id: 2, name: "Trekking", label: "Trekking", emoji: "🥾" },
  { id: 3, name: "Escalada", label: "Escalada", emoji: "🧗" },
  { id: 4, name: "Surf",     label: "Surf",     emoji: "🏄" },
  { id: 5, name: "Kayak",    label: "Kayak",    emoji: "🛶" },
]

const DEPARTMENTS = [
  "Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida",
  "Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro","Rivera","Rocha",
  "Salto","San José","Soriano","Tacuarembó","Treinta y Tres",
]

const MONTHS = [
  { value: "1",  label: "Enero" },    { value: "2",  label: "Febrero" },
  { value: "3",  label: "Marzo" },    { value: "4",  label: "Abril" },
  { value: "5",  label: "Mayo" },     { value: "6",  label: "Junio" },
  { value: "7",  label: "Julio" },    { value: "8",  label: "Agosto" },
  { value: "9",  label: "Setiembre" },{ value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },{ value: "12", label: "Diciembre" },
]

const AMENITY_CATEGORIES = [
  {
    id: "esenciales", label: "Esenciales", emoji: "⚡",
    names: ["Ducha","Agua caliente","Baños","Agua potable","Electricidad","Tomas para camper/van","Área para motorhomes"],
  },
  {
    id: "cocina", label: "Cocina & comida", emoji: "🍽️",
    names: ["Cocina compartida","Heladera","Comedor","Parrillero","Leña disponible","Proveeduría/kiosco","Cafetería","Restaurante/bar"],
  },
  {
    id: "actividades", label: "Actividades & diversión", emoji: "🏄",
    names: ["Acceso a río/lago/mar","Playa","Piscina","Cancha de fútbol","Cancha de Voley","Alquiler de bicis","Kayak"],
  },
  {
    id: "comodidades", label: "Comodidades del sitio", emoji: "🏕️",
    names: ["Parcelas delimitadas","Mesas y bancos","Zona para fogón","Sombra","Lavadero"],
  },
  {
    id: "extras", label: "Extras & servicios", emoji: "🔧",
    names: ["WiFi","Seguridad","Estacionamiento","Acepta mascotas"],
  },
]

const AMENITY_ICONS: Record<string, string> = {
  "Ducha":"🚿","Agua caliente":"🔥","Baños":"🚽","Agua potable":"🚰",
  "Electricidad":"⚡","Lavadero":"🧼","Parrillero":"🔥",
  "Cocina compartida":"🍳","Comedor":"🍽️","Heladera":"🧊",
  "Leña disponible":"🪵","Sombra":"🌳","Mesas y bancos":"🪑",
  "Parcelas delimitadas":"⛺","Acceso a río/lago/mar":"🌊","Playa":"🏖️",
  "Cancha de fútbol":"⚽","Cancha de Voley":"🏐","Piscina":"🏊",
  "Alquiler de bicis":"🚴","Kayak":"🛶","WiFi":"🛜",
  "Acepta mascotas":"🐶","Proveeduría/kiosco":"🛒","Cafetería":"☕",
  "Restaurante/bar":"🍺","Estacionamiento":"🚗","Seguridad":"🔒",
  "Zona para fogón":"🏕️","Tomas para camper/van":"🔌","Área para motorhomes":"🚐",
  "Cama incluida":             "🛏️",
  "Ropa de cama":              "🛌",
  "Baño privado":              "🚿",
  "Calefacción":               "🌡️",
  "Aire acondicionado":        "❄️",
  "Desayuno incluido":         "🥐",
  "Cocina equipada":           "🍳",
  "Parrilla privada":          "🔥",
  "Terraza / deck":            "🌅",
  "Vista panorámica":          "🏔️",
  "Fogón privado":             "🔥",
  "Bañera / jacuzzi":          "🛁",
  "Zona de descanso exterior": "🌿",
}

const GLAMPING_AMENITY_CATEGORIES = [
  {
    id: "alojamiento",
    label: "Alojamiento",
    emoji: "🛏️",
    names: ["Cama incluida", "Ropa de cama", "Baño privado", "Calefacción", "Aire acondicionado"],
  },
  {
    id: "comidas-glamp",
    label: "Comidas & cocina",
    emoji: "🍽️",
    names: ["Desayuno incluido", "Cocina equipada", "Parrilla privada", "Heladera"],
  },
  {
    id: "experiencia",
    label: "Experiencia glamping",
    emoji: "🌿",
    names: ["Terraza / deck", "Vista panorámica", "Fogón privado", "Bañera / jacuzzi", "Zona de descanso exterior"],
  },
  {
    id: "servicios-glamp",
    label: "Servicios",
    emoji: "⚡",
    names: ["WiFi", "Electricidad", "Agua caliente", "Acepta mascotas", "Estacionamiento"],
  },
  {
    id: "extras-glamp",
    label: "Extras",
    emoji: "📷",
    names: ["Piscina", "Acceso a río/lago/mar"],
  },
]

// ---- Helpers ----
function buildPublicId(category: string, spotName: string, index: number): string {
  const formatted = spotName
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_")
  return `${category}/${formatted}/${formatted}${index + 1}`
}

const TREKKING_FEATURES: { key: TrekkingFeatureKey; label: string; emoji: string }[] = [
  { key: "bathrooms",     label: "Baños",           emoji: "🚽" },
  { key: "potable_water", label: "Agua potable",     emoji: "🚰" },
  { key: "pet_friendly",  label: "Pet friendly",     emoji: "🐶" },
  { key: "kids_friendly", label: "Apto niños",       emoji: "👶" },
  { key: "camping",       label: "Camping",          emoji: "⛺" },
  { key: "parking",       label: "Estacionamiento",  emoji: "🚗" },
  { key: "fire_pits",     label: "Fogones",          emoji: "🔥" },
  { key: "shelter",       label: "Refugio",          emoji: "🏠" },
  { key: "accessible",    label: "Accesible",        emoji: "♿" },
  { key: "signal",        label: "Señal móvil",      emoji: "📱" },
]

const REQUIRED_FEATURE_KEYS: TrekkingFeatureKey[] = [
  "bathrooms", "potable_water", "pet_friendly", "kids_friendly",
  "camping", "parking", "fire_pits", "shelter", "accessible",
]

const defaultTrekkingFeatures = (): TrekkingFeatures => ({
  bathrooms: null, potable_water: null, pet_friendly: null, kids_friendly: null,
  camping: null, parking: null, fire_pits: null, shelter: null, accessible: null, signal: null,
})

const defaultRoute = (): RouteItem => ({
  name: "", distance_km: "", duration_hours: "", elevation_gain: "", elevation_loss: "",
  max_altitude: "", min_altitude: "", difficulty: "", route_type: "",
  technical_level: "", physical_demand: "",
})
const defaultSector = (): SectorItem => ({ name: "", type: "", max_altitude: "", restrictions: "" })
const defaultSurf = (): SurfItem => ({
  name: "", class_type: "", duration: "", equipment_include: false,
  season_type: "all_year", season_start: "", season_end: "",
  email: "", whatsapp: "", instagram: "",
})
const defaultKayak = (): KayakItem => ({
  name: "", water_type: "", difficulty: "", duration: "", kayak_type: "",
  rental_available: false, season_type: "all_year", season_start: "", season_end: "",
  email: "", whatsapp: "", instagram: "",
})
const emptyBasic = () => ({
  owner_contact_type: "email" as "email" | "phone",
  owner_email: "", owner_phone: "",
  name: "", description: "", department: "",
  price: "", season_type: "all_year" as "all_year" | "seasonal",
  season_start: "", season_end: "",
  email: "", whatsapp: "", instagram: "", lat: "", lng: "",
})

// ---- Component ----
export default function AgregarLugar() {
  const { data: session } = useSession()
  const token = session?.id_token

  const [step, setStep]                           = useState(1)
  const [selectedCat, setSelectedCat]             = useState<Category | null>(null)
  const [basic, setBasic]                         = useState(emptyBasic())
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [trekkingFeatures, setTrekkingFeatures]   = useState<TrekkingFeatures>(defaultTrekkingFeatures())
  const [routes, setRoutes]                       = useState<RouteItem[]>([defaultRoute()])
  const [sectors, setSectors]                     = useState<SectorItem[]>([defaultSector()])
  const [surf, setSurf]                           = useState<SurfItem>(defaultSurf())
  const [kayaks, setKayaks]                       = useState<KayakItem[]>([defaultKayak()])
  const [images, setImages]                       = useState<File[]>([])
  const [previews, setPreviews]                   = useState<string[]>([])
  const [surfPhotoFiles, setSurfPhotoFiles]       = useState<(File | null)[]>([null, null, null])
  const [surfPhotoPreviews, setSurfPhotoPreviews] = useState<(string | null)[]>([null, null, null])
  const [kayakPhotoFiles, setKayakPhotoFiles]     = useState<(File | null)[]>([null, null, null])
  const [kayakPhotoPreviews, setKayakPhotoPreviews] = useState<(string | null)[]>([null, null, null])
  const [isPublic, setIsPublic]                   = useState<boolean | null>(null)
  const [publicTransport, setPublicTransport]     = useState<string | null>(null)
  const [contactError, setContactError]           = useState<string | null>(null)
  const [featureErrors, setFeatureErrors]         = useState<Set<TrekkingFeatureKey>>(new Set())
  const [submitting, setSubmitting]               = useState(false)
  const [uploadProgress, setUploadProgress]       = useState<string | null>(null)
  const [error, setError]                         = useState<string | null>(null)
  const [success, setSuccess]                     = useState(false)
  const fileRef                                   = useRef<HTMLInputElement>(null)
  const surfPhotoRef1                             = useRef<HTMLInputElement>(null)
  const surfPhotoRef2                             = useRef<HTMLInputElement>(null)
  const surfPhotoRef3                             = useRef<HTMLInputElement>(null)
  const kayakPhotoRef1                            = useRef<HTMLInputElement>(null)
  const kayakPhotoRef2                            = useRef<HTMLInputElement>(null)
  const kayakPhotoRef3                            = useRef<HTMLInputElement>(null)
  const [selectedSpotId, setSelectedSpotId]       = useState<number | null>(null)
  const [availableSpots, setAvailableSpots]       = useState<{ id: number; name: string }[]>([])
  const [loadingSpots, setLoadingSpots]           = useState(false)
  const isService  = selectedCat?.name === "Surf" || selectedCat?.name === "Kayak"
  const isTrekking = selectedCat?.name === "Trekking"
  const summaryStep = isService ? 4 : isTrekking ? 6 : 5

  function upd(field: string, val: string) {
    setBasic(prev => ({ ...prev, [field]: val }))
    if ((field === "email" || field === "whatsapp" || field === "instagram") && val.trim()) {
      setContactError(null)
    }
  }
  function updRoute(i: number, field: string, val: string | boolean) {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function updSector(i: number, field: string, val: string) {
    setSectors(prev => prev.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec))
  }
  function updKayak(i: number, field: string, val: string | boolean) {
    setKayaks(prev => prev.map((k, idx) => idx === i ? { ...k, [field]: val } : k))
  }
  function updKayakSeason(i: number, t: "all_year" | "seasonal") {
    setKayaks(prev => prev.map((k, idx) => idx === i ? { ...k, season_type: t } : k))
  }
  function handleSurfPhoto(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSurfPhotoFiles(prev => { const n = [...prev]; n[index] = file; return n })
    setSurfPhotoPreviews(prev => { const n = [...prev]; n[index] = file ? URL.createObjectURL(file) : null; return n })
  }
  function handleKayakPhoto(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setKayakPhotoFiles(prev => { const n = [...prev]; n[index] = file; return n })
    setKayakPhotoPreviews(prev => { const n = [...prev]; n[index] = file ? URL.createObjectURL(file) : null; return n })
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10)
    if ((e.target.files?.length ?? 0) > 10) {
      setError("Podés subir un máximo de 10 imágenes. Se tomaron las primeras 10.")
    } else {
      setError(null)
    }
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }
  function toggleAmenity(name: string) {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  async function handleCategorySelect(cat: Category) {
    setSelectedCat(cat)
    const isServ = cat.name === "Surf" || cat.name === "Kayak"
    if (isServ) {
      setLoadingSpots(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots?activity=${cat.name}`)
        const data = await res.json()
        setAvailableSpots(data.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })))
      } catch {
        // proceed with empty list if fetch fails
      } finally {
        setLoadingSpots(false)
      }
    }
    setStep(2)
  }

  function goToStep3() {
    if (isService) {
      if (!selectedSpotId) {
        setError("Seleccioná un lugar para continuar.")
        return
      }
      setError(null)
      setStep(3)
      return
    }
    const hasContact = basic.owner_contact_type === "email" ? !!basic.owner_email : !!basic.owner_phone
    if (!hasContact || !basic.name || !basic.description || !basic.department) {
      setError("Completá los campos obligatorios.")
      return
    }
    if (isPublic === null) {
      setError("Indicá si el lugar es público o privado.")
      return
    }
    if (!basic.email.trim() && !basic.whatsapp.trim() && !basic.instagram.trim()) {
      setContactError("Ingresá al menos un medio de contacto.")
      return
    }
    setContactError(null)
    setError(null)
    setStep(3)
  }

  function goToStep4() {
    if (isTrekking) {
      const missing = REQUIRED_FEATURE_KEYS.filter(k => trekkingFeatures[k] === null)
      if (missing.length > 0) {
        setFeatureErrors(new Set(missing))
        setError("Completá todas las características obligatorias antes de continuar.")
        return
      }
      setFeatureErrors(new Set())
    }
    setError(null)
    setStep(4)
  }

  async function handleSubmit() {
    const cat = selectedCat!.name
    if (isService) {
      setError(null)
      setSubmitting(true)
      try {
        if (cat === "Surf" && surf.name) {
          if (!surfPhotoFiles[0]) { setError("La foto de portada es obligatoria."); setSubmitting(false); return }

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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              spot_id: selectedSpotId,
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
          if (!kayakPhotoFiles[0]) { setError("La foto de portada es obligatoria."); setSubmitting(false); return }

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
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                spot_id: selectedSpotId,
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
      // 1. Upload images
      const uploadedIds: string[] = []
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Subiendo imágenes... (${i + 1} de ${images.length})`)
        const fd = new FormData()
        fd.append("file", images[i])
        fd.append("public_id", buildPublicId(selectedCat!.name, basic.name, i))
        const res = await fetch("/api/upload/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error("Error al subir imagen")
        const data = await res.json()
        uploadedIds.push(data.public_id)
      }

      // 2. Create spot
      setUploadProgress("Guardando lugar...")
      const seasonStart = basic.season_type === "seasonal" && basic.season_start ? parseInt(basic.season_start) : null
      const seasonEnd   = basic.season_type === "seasonal" && basic.season_end   ? parseInt(basic.season_end)   : null
      const spotRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:         basic.name,
          description:  basic.description,
          department:   basic.department,
          category_id:  selectedCat!.id,
          owner_email:  basic.owner_contact_type === "email" ? (basic.owner_email || null) : null,
          owner_phone:  basic.owner_contact_type === "phone" ? (basic.owner_phone || null) : null,
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

      // 3. Add images
      for (let i = 0; i < uploadedIds.length; i++) {
        const params = new URLSearchParams({
          cloudinary_public_id: uploadedIds[i],
          is_main: String(i === 0),
          order: String(i),
        })
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${spotId}?${params}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }

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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ price: basic.price ? parseFloat(basic.price) : null }),
        })
      }

      if (cat === "Glamping") {
        const glampRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/glamping/spots/${spotId}/glamping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  function reset() {
    setStep(1); setSelectedCat(null); setBasic(emptyBasic())
    setSelectedAmenities([]); setRoutes([defaultRoute()]); setSectors([defaultSector()])
    setTrekkingFeatures(defaultTrekkingFeatures())
    setSurf(defaultSurf()); setKayaks([defaultKayak()])
    setImages([]); setPreviews([])
    setSurfPhotoFiles([null, null, null]); setSurfPhotoPreviews([null, null, null])
    setKayakPhotoFiles([null, null, null]); setKayakPhotoPreviews([null, null, null])
    setContactError(null); setFeatureErrors(new Set()); setError(null); setSuccess(false)
    setSelectedSpotId(null); setAvailableSpots([])
    setIsPublic(null); setPublicTransport(null)
  }

  // ---- Fixed header (always shown) ----
  const pageHeader = (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <img src="/RumboLogo.png" alt="Rumbo" style={{ width: 36, height: 36, objectFit: "contain" }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#1b1b19" }}>Rumbo</span>
      </div>
      <p style={{ fontSize: 13, color: "#7a7669", maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
        Completá este formulario para agregar tu lugar a la plataforma. Revisaremos la información antes de publicarlo.
      </p>
    </div>
  )

  // ---- Success screen ----
  if (success) {
    return (
      <div style={s.page}>
        <style>{mediaQuery}</style>
        <div style={{ ...s.container, textAlign: "center", paddingTop: 32 }}>
          {pageHeader}
          <div style={{ marginTop: 48 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>¡Gracias!</p>
            <p style={{ fontSize: 16, color: "#7a7669", marginBottom: 36 }}>Tu lugar fue enviado y será revisado pronto.</p>
            <button style={s.btnPrimary} onClick={reset}>Enviar otro lugar</button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Main render ----
  return (
    <div style={s.page}>
      <style>{mediaQuery}</style>
      <div style={s.container}>

        {pageHeader}
        <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 28, textAlign: "center" }}>Paso {step} de {summaryStep}</p>

        {/* ── Step 1: Category ── */}
        {step === 1 && (
          <div>
            <h2 style={s.title}>¿Qué tipo de lugar es?</h2>
            <div style={s.catGrid}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} style={s.catCard} onClick={() => handleCategorySelect(cat)}>
                  <span style={{ fontSize: 32 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1b1b19" }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Basic info / Service spot selector ── */}
        {step === 2 && isService && (
          <div>
            <h2 style={s.title}>
              {selectedCat?.name === "Surf" ? "¿En qué playa operás?" : "¿En qué río o laguna operás?"}
            </h2>
            <p style={{ fontSize: 14, color: "#7a7669", marginBottom: 20 }}>
              {selectedCat?.name === "Surf"
                ? "Seleccioná la playa donde funciona tu escuela de surf."
                : "Seleccioná el río o laguna donde ofrecés el servicio de kayak."}
            </p>
            <div style={s.form}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {loadingSpots ? (
                  <p style={{ fontSize: 13, color: "#9a9690" }}>Cargando lugares...</p>
                ) : availableSpots.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9a9690" }}>
                    No hay lugares disponibles aún. Contactanos para agregar el tuyo.
                  </p>
                ) : (
                  <select
                    style={s.input}
                    value={selectedSpotId ?? ""}
                    onChange={e => setSelectedSpotId(Number(e.target.value))}
                  >
                    <option value="" disabled>-- Seleccioná un lugar --</option>
                    {availableSpots.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <NavRow onBack={() => { setStep(1); setSelectedSpotId(null); setAvailableSpots([]) }} onNext={goToStep3} error={error} />
          </div>
        )}

        {step === 2 && !isService && (
          <div>
            <h2 style={s.title}>Información básica</h2>
            <div style={s.form}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19" }}>
                  Tu contacto{" "}
                  <span style={{ fontSize: 12, color: "#e53e3e", fontWeight: 400 }}>(obligatorio)</span>
                  <div style={{ fontSize: 11, fontWeight: 400, color: "#7a7669", marginTop: 2 }}>No se mostrará públicamente</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["email", "phone"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBasic(prev => ({ ...prev, owner_contact_type: t }))}
                      style={{
                        padding: "6px 16px", borderRadius: 20,
                        border: `1px solid ${basic.owner_contact_type === t ? "#2d6a4f" : "#e0ddd6"}`,
                        background: basic.owner_contact_type === t ? "#2d6a4f" : "#f7f5f0",
                        color: basic.owner_contact_type === t ? "#fff" : "#1b1b19",
                        fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {t === "email" ? "Email" : "Teléfono"}
                    </button>
                  ))}
                </div>
                {basic.owner_contact_type === "email" ? (
                  <input style={s.input} type="email" placeholder="tucorreo@email.com" value={basic.owner_email} onChange={e => upd("owner_email", e.target.value)} />
                ) : (
                  <input style={s.input} type="tel" placeholder="Ej: 099123456" value={basic.owner_phone} onChange={e => upd("owner_phone", e.target.value)} />
                )}
              </div>
              <Field label="Nombre del lugar" required={true}>
                <input style={s.input} type="text" value={basic.name} onChange={e => upd("name", e.target.value)} />
              </Field>
              <Field label="Descripción" required={true}>
                <textarea
                  style={{ ...s.input, height: 96, resize: "vertical" } as CSSProperties}
                  value={basic.description}
                  onChange={e => upd("description", e.target.value)}
                  placeholder="Contá cómo es el lugar, qué lo hace especial, qué pueden esperar quienes lo visiten. Cuanto más detalle, mejor."
                />
              </Field>
              <Field label="Departamento" required={true}>
                <select style={s.input} value={basic.department} onChange={e => upd("department", e.target.value)}>
                  <option value="">Seleccioná...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <div className="form-two-col">
                <Field label="Precio" required={false}>
                  <input style={s.input} type="number" value={basic.price} onChange={e => upd("price", e.target.value)} />
                </Field>
                <div />
              </div>
              <SeasonToggle
                type={basic.season_type}
                onTypeChange={t => setBasic(prev => ({ ...prev, season_type: t }))}
                start={basic.season_start}
                onStartChange={v => upd("season_start", v)}
                end={basic.season_end}
                onEndChange={v => upd("season_end", v)}
              />
              <div className="form-two-col">
                <Field label="Email del lugar" required={false}>
                  <input style={s.input} type="email" value={basic.email} onChange={e => upd("email", e.target.value)} />
                </Field>
                <Field label="WhatsApp" required={false}>
                  <input style={s.input} type="text" placeholder="Ej: 099123456" value={basic.whatsapp} onChange={e => upd("whatsapp", e.target.value)} />
                </Field>
              </div>
              <div className="form-two-col">
                <Field label="Instagram" required={false}>
                  <input style={s.input} type="text" placeholder="@usuario" value={basic.instagram} onChange={e => upd("instagram", e.target.value)} />
                </Field>
                <div />
              </div>
              {contactError && (
                <p style={{ fontSize: 12, color: "#c0392b", margin: "-6px 0 0" }}>{contactError}</p>
              )}

              {/* ¿Público o privado? */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19" }}>
                  ¿El lugar es público o privado?{" "}
                  <span style={{ fontSize: 12, color: "#e53e3e", fontWeight: 400 }}>(obligatorio)</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {([
                    { value: true,  label: "🏛️ Público" },
                    { value: false, label: "🔒 Privado" },
                  ] as { value: boolean; label: string }[]).map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setIsPublic(opt.value)}
                      style={{
                        padding: "6px 16px", borderRadius: 20,
                        border: `1px solid ${isPublic === opt.value ? "#2d6a4f" : "#e0ddd6"}`,
                        background: isPublic === opt.value ? "#2d6a4f" : "#f7f5f0",
                        color: isPublic === opt.value ? "#fff" : "#1b1b19",
                        fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ¿Accesible en transporte público? */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19" }}>
                  ¿Es accesible en transporte público?{" "}
                  <span style={{ fontSize: 12, color: "#9a9690", fontWeight: 400 }}>(opcional)</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {([
                    { value: "si",   label: "✅ Sí" },
                    { value: "no",   label: "❌ No" },
                    { value: "nose", label: "🤷 No sé" },
                  ] as { value: string; label: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPublicTransport(prev => prev === opt.value ? null : opt.value)}
                      style={{
                        padding: "6px 16px", borderRadius: 20,
                        border: `1px solid ${publicTransport === opt.value ? "#2d6a4f" : "#e0ddd6"}`,
                        background: publicTransport === opt.value ? "#2d6a4f" : "#f7f5f0",
                        color: publicTransport === opt.value ? "#fff" : "#1b1b19",
                        fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <LocationPicker
                lat={basic.lat ? parseFloat(basic.lat) : null}
                lng={basic.lng ? parseFloat(basic.lng) : null}
                onLocationSelect={(lat: number, lng: number) => {
                  upd("lat", String(lat))
                  upd("lng", String(lng))
                }}
              />
            </div>
            <NavRow onBack={() => setStep(1)} onNext={goToStep3} error={error} />
          </div>
        )}

        {/* ── Step 3: Category-specific ── */}
        {step === 3 && (
          <div>
            <h2 style={s.title}>
              {selectedCat?.name === "Camping" || selectedCat?.name === "Glamping"
                ? "Servicios e instalaciones"
                : selectedCat?.name === "Trekking"
                ? "Características del lugar"
                : `Datos de ${selectedCat?.label}`}
            </h2>

            {/* Camping: Amenities */}
            {selectedCat?.name === "Camping" && (
              <div>
                <p style={{ fontSize: 14, color: "#7a7669", marginBottom: 20 }}>
                  Seleccioná los servicios disponibles en tu camping. Podés dejar todo sin seleccionar.
                </p>
                {AMENITY_CATEGORIES.map(grp => (
                  <div key={grp.id} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#7a7669", marginBottom: 8 }}>
                      {grp.emoji} {grp.label}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {grp.names.map(name => {
                        const icon = AMENITY_ICONS[name] ?? ""
                        const sel = selectedAmenities.includes(name)
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleAmenity(name)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 20,
                              border: `1px solid ${sel ? "#2d6a4f" : "#e0ddd6"}`,
                              background: sel ? "#2d6a4f" : "#f7f5f0",
                              color: sel ? "#fff" : "#1b1b19",
                              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {icon && <span>{icon}</span>}
                            <span>{name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Glamping */}
            {selectedCat?.name === "Glamping" && (
              <div>
                <p style={{ fontSize: 14, color: "#7a7669", marginBottom: 20 }}>
                  Seleccioná los servicios disponibles en tu glamping. Podés dejar todo sin seleccionar.
                </p>
                {GLAMPING_AMENITY_CATEGORIES.map(grp => (
                  <div key={grp.id} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#7a7669", marginBottom: 8 }}>
                      {grp.emoji} {grp.label}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {grp.names.map(name => {
                        const icon = AMENITY_ICONS[name] ?? ""
                        const sel = selectedAmenities.includes(name)
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleAmenity(name)}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "6px 12px", borderRadius: 20,
                              border: `1px solid ${sel ? "#2d6a4f" : "#e0ddd6"}`,
                              background: sel ? "#2d6a4f" : "#f7f5f0",
                              color: sel ? "#fff" : "#1b1b19",
                              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {icon && <span>{icon}</span>}
                            <span>{name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trekking — Step 3: Características del lugar */}
            {selectedCat?.name === "Trekking" && (
              <div>
                <div style={s.card}>
                  <p style={s.cardTitle}>Características del lugar</p>
                  <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 16, marginTop: -6 }}>
                    Indicá si el lugar cuenta con cada característica. Señal móvil es opcional.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {TREKKING_FEATURES.map(({ key, label, emoji }) => {
                      const hasError = featureErrors.has(key)
                      return (
                        <div
                          key={key}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                            padding: "7px 10px", borderRadius: 10,
                            background: hasError ? "#fff5f5" : "transparent",
                            border: hasError ? "1px solid #fecaca" : "1px solid transparent",
                            transition: "background 0.15s, border-color 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 14, color: hasError ? "#dc2626" : "#1b1b19" }}>
                            {emoji} {label}
                            {key !== "signal" && <span style={{ color: "#e53e3e", marginLeft: 3, fontSize: 12 }}>*</span>}
                          </span>
                          <TriStateToggle
                            value={trekkingFeatures[key]}
                            onChange={v => {
                              setTrekkingFeatures(prev => ({ ...prev, [key]: v }))
                              if (v !== null) {
                                setFeatureErrors(prev => {
                                  const n = new Set(prev)
                                  n.delete(key)
                                  return n
                                })
                              }
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Escalada */}
            {selectedCat?.name === "Escalada" && (
              <div>
                {sectors.map((sec, i) => (
                  <div key={i} style={s.card}>
                    <p style={s.cardTitle}>Sector {i + 1}</p>
                    <div style={s.form}>
                      <Field label="Nombre" required={true}>
                        <input style={s.input} value={sec.name} onChange={e => updSector(i, "name", e.target.value)} />
                      </Field>
                      <div className="form-two-col">
                        <Field label="Tipo" required={false}>
                          <select style={s.input} value={sec.type} onChange={e => updSector(i, "type", e.target.value)}>
                            <option value="">-</option>
                            <option value="boulder">Boulder</option><option value="deportiva">Deportiva</option><option value="tradicional">Tradicional</option>
                          </select>
                        </Field>
                        <Field label="Altitud máxima (m)" required={false}>
                          <input style={s.input} type="number" value={sec.max_altitude} onChange={e => updSector(i, "max_altitude", e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Restricciones" required={false}>
                        <input style={s.input} value={sec.restrictions} onChange={e => updSector(i, "restrictions", e.target.value)} />
                      </Field>
                    </div>
                  </div>
                ))}
                <button style={s.btnAdd} onClick={() => setSectors(prev => [...prev, defaultSector()])}>+ Agregar sector</button>
              </div>
            )}

            {/* Surf */}
            {selectedCat?.name === "Surf" && (
              <div style={s.card}>
                <div style={s.form}>
                  <Field label="Nombre de la escuela" required={true}>
                    <input style={s.input} value={surf.name} onChange={e => setSurf(p => ({ ...p, name: e.target.value }))} />
                  </Field>
                  <div className="form-two-col">
                    <Field label="Tipo de clase" required={false}>
                      <select style={s.input} value={surf.class_type} onChange={e => setSurf(p => ({ ...p, class_type: e.target.value }))}>
                        <option value="">-</option>
                        <option value="grupal">Grupal</option><option value="privada">Privada</option><option value="intensivo">Intensivo</option>
                      </select>
                    </Field>
                    <Field label="Duración (horas)" required={false}>
                      <input style={s.input} type="number" step="any" value={surf.duration} onChange={e => setSurf(p => ({ ...p, duration: e.target.value }))} />
                    </Field>
                  </div>
                  <SeasonToggle
                    type={surf.season_type}
                    onTypeChange={t => setSurf(p => ({ ...p, season_type: t }))}
                    start={surf.season_start} onStartChange={v => setSurf(p => ({ ...p, season_start: v }))}
                    end={surf.season_end}   onEndChange={v => setSurf(p => ({ ...p, season_end: v }))}
                  />
                  <div className="form-two-col">
                    <Field label="Email" required={false}><input style={s.input} type="email" value={surf.email} onChange={e => setSurf(p => ({ ...p, email: e.target.value }))} /></Field>
                    <Field label="WhatsApp" required={false}><input style={s.input} type="text" placeholder="Ej: 099123456" value={surf.whatsapp} onChange={e => setSurf(p => ({ ...p, whatsapp: e.target.value }))} /></Field>
                  </div>
                  <div className="form-two-col">
                    <Field label="Instagram" required={false}><input style={s.input} type="text" placeholder="@usuario" value={surf.instagram} onChange={e => setSurf(p => ({ ...p, instagram: e.target.value }))} /></Field>
                    <div />
                  </div>
                  <Toggle label="Equipo incluido" checked={surf.equipment_include} onChange={v => setSurf(p => ({ ...p, equipment_include: v }))} />

                  {/* Fotos de la escuela */}
                  <div style={{ borderTop: "1px solid #e0ddd6", paddingTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>Fotos de la escuela</p>
                    <p style={{ fontSize: 12, color: "#9a9690", margin: "0 0 14px" }}>La foto de portada es obligatoria</p>
                    {([
                      { label: "Foto de portada", req: true,  ref: surfPhotoRef1, i: 0 },
                      { label: "Foto adicional 2", req: false, ref: surfPhotoRef2, i: 1 },
                      { label: "Foto adicional 3", req: false, ref: surfPhotoRef3, i: 2 },
                    ] as { label: string; req: boolean; ref: React.RefObject<HTMLInputElement | null>; i: number }[]).map(({ label, req, ref, i }) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleSurfPhoto(i, e)} />
                        {surfPhotoPreviews[i] ? (
                          <div style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                            <img src={surfPhotoPreviews[i]!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            <button
                              type="button"
                              onClick={() => {
                                setSurfPhotoFiles(prev => { const n = [...prev]; n[i] = null; return n })
                                setSurfPhotoPreviews(prev => { const n = [...prev]; n[i] = null; return n })
                                if (ref.current) ref.current.value = ""
                              }}
                              style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}
                            >×</button>
                          </div>
                        ) : (
                          <div
                            onClick={() => ref.current?.click()}
                            style={{ width: 88, height: 64, borderRadius: 10, border: "2px dashed #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f7f5f0", flexShrink: 0 }}
                          >
                            <span style={{ fontSize: 22, color: "#c8c4bc" }}>+</span>
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 12, color: req ? "#e53e3e" : "#9a9690", margin: "2px 0 0" }}>{req ? "(obligatoria)" : "(opcional)"}</p>
                          {!surfPhotoPreviews[i] && (
                            <button type="button" onClick={() => ref.current?.click()} style={{ ...s.btnAdd, marginTop: 6, padding: "4px 12px", fontSize: 12 }}>
                              Seleccionar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Kayak */}
            {selectedCat?.name === "Kayak" && (
              <div>
                {kayaks.map((k, i) => (
                  <div key={i} style={s.card}>
                    <p style={s.cardTitle}>Servicio {i + 1}</p>
                    <div style={s.form}>
                      <Field label="Nombre" required={true}>
                        <input style={s.input} value={k.name} onChange={e => updKayak(i, "name", e.target.value)} />
                      </Field>
                      <div className="form-two-col">
                        <Field label="Tipo de agua" required={false}>
                          <select style={s.input} value={k.water_type} onChange={e => updKayak(i, "water_type", e.target.value)}>
                            <option value="">-</option>
                            <option value="rio">Río</option><option value="lago">Lago</option><option value="mar">Mar</option>
                          </select>
                        </Field>
                        <Field label="Dificultad" required={false}>
                          <select style={s.input} value={k.difficulty} onChange={e => updKayak(i, "difficulty", e.target.value)}>
                            <option value="">-</option>
                            <option value="facil">Fácil</option><option value="intermedio">Intermedio</option><option value="dificil">Difícil</option>
                          </select>
                        </Field>
                      </div>
                      <div className="form-two-col">
                        <Field label="Duración (horas)" required={false}>
                          <input style={s.input} type="number" step="any" value={k.duration} onChange={e => updKayak(i, "duration", e.target.value)} />
                        </Field>
                        <Field label="Tipo de kayak" required={false}>
                          <select style={s.input} value={k.kayak_type} onChange={e => updKayak(i, "kayak_type", e.target.value)}>
                            <option value="">-</option>
                            <option value="travesia">Travesía</option><option value="recreativo">Recreativo</option><option value="rapido">Rápido</option>
                          </select>
                        </Field>
                      </div>
                      <SeasonToggle
                        type={k.season_type}
                        onTypeChange={t => updKayakSeason(i, t)}
                        start={k.season_start} onStartChange={v => updKayak(i, "season_start", v)}
                        end={k.season_end}     onEndChange={v => updKayak(i, "season_end", v)}
                      />
                      <div className="form-two-col">
                        <Field label="Email" required={false}><input style={s.input} type="email" value={k.email} onChange={e => updKayak(i, "email", e.target.value)} /></Field>
                        <Field label="WhatsApp" required={false}><input style={s.input} type="text" placeholder="Ej: 099123456" value={k.whatsapp} onChange={e => updKayak(i, "whatsapp", e.target.value)} /></Field>
                      </div>
                      <div className="form-two-col">
                        <Field label="Instagram" required={false}><input style={s.input} type="text" placeholder="@usuario" value={k.instagram} onChange={e => updKayak(i, "instagram", e.target.value)} /></Field>
                        <div />
                      </div>
                      <Toggle label="Alquiler disponible" checked={k.rental_available} onChange={v => updKayak(i, "rental_available", v)} />

                      {/* Fotos del servicio (solo primer item) */}
                      {i === 0 && (
                        <div style={{ borderTop: "1px solid #e0ddd6", paddingTop: 16 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>Fotos del servicio</p>
                          <p style={{ fontSize: 12, color: "#9a9690", margin: "0 0 14px" }}>La foto de portada es obligatoria</p>
                          {([
                            { label: "Foto de portada", req: true,  ref: kayakPhotoRef1, idx: 0 },
                            { label: "Foto adicional 2", req: false, ref: kayakPhotoRef2, idx: 1 },
                            { label: "Foto adicional 3", req: false, ref: kayakPhotoRef3, idx: 2 },
                          ] as { label: string; req: boolean; ref: React.RefObject<HTMLInputElement | null>; idx: number }[]).map(({ label, req, ref, idx }) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                              <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleKayakPhoto(idx, e)} />
                              {kayakPhotoPreviews[idx] ? (
                                <div style={{ position: "relative", width: 88, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                                  <img src={kayakPhotoPreviews[idx]!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setKayakPhotoFiles(prev => { const n = [...prev]; n[idx] = null; return n })
                                      setKayakPhotoPreviews(prev => { const n = [...prev]; n[idx] = null; return n })
                                      if (ref.current) ref.current.value = ""
                                    }}
                                    style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", lineHeight: 1 }}
                                  >×</button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => ref.current?.click()}
                                  style={{ width: 88, height: 64, borderRadius: 10, border: "2px dashed #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f7f5f0", flexShrink: 0 }}
                                >
                                  <span style={{ fontSize: 22, color: "#c8c4bc" }}>+</span>
                                </div>
                              )}
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{label}</p>
                                <p style={{ fontSize: 12, color: req ? "#e53e3e" : "#9a9690", margin: "2px 0 0" }}>{req ? "(obligatoria)" : "(opcional)"}</p>
                                {!kayakPhotoPreviews[idx] && (
                                  <button type="button" onClick={() => ref.current?.click()} style={{ ...s.btnAdd, marginTop: 6, padding: "4px 12px", fontSize: 12 }}>
                                    Seleccionar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isService ? (
              <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} error={error} />
            ) : (
              <NavRow onBack={() => setStep(2)} onNext={goToStep4} error={error} />
            )}
          </div>
        )}

        {/* ── Step 4 — Trekking: Rutas ── */}
        {step === 4 && isTrekking && (
          <div>
            <h2 style={s.title}>Rutas</h2>
            {routes.map((r, i) => (
              <div key={i} style={s.card}>
                <p style={s.cardTitle}>Ruta {i + 1}</p>
                <div style={s.form}>
                  <Field label="Nombre" required={true}>
                    <input style={s.input} value={r.name} onChange={e => updRoute(i, "name", e.target.value)} />
                  </Field>
                  <div className="form-two-col">
                    <Field label="Distancia (km)" required={false}><input style={s.input} type="number" step="any" value={r.distance_km} onChange={e => updRoute(i, "distance_km", e.target.value)} /></Field>
                    <Field label="Duración (horas)" required={false}><input style={s.input} type="number" step="any" value={r.duration_hours} onChange={e => updRoute(i, "duration_hours", e.target.value)} /></Field>
                  </div>
                  <div className="form-two-col">
                    <Field label="Desnivel positivo (m)" required={false}><input style={s.input} type="number" value={r.elevation_gain} onChange={e => updRoute(i, "elevation_gain", e.target.value)} /></Field>
                    <Field label="Desnivel negativo (m)" required={false}><input style={s.input} type="number" value={r.elevation_loss} onChange={e => updRoute(i, "elevation_loss", e.target.value)} /></Field>
                  </div>
                  <div className="form-two-col">
                    <Field label="Altitud máxima (m)" required={false}><input style={s.input} type="number" value={r.max_altitude} onChange={e => updRoute(i, "max_altitude", e.target.value)} /></Field>
                    <Field label="Altitud mínima (m)" required={false}><input style={s.input} type="number" value={r.min_altitude} onChange={e => updRoute(i, "min_altitude", e.target.value)} /></Field>
                  </div>
                  <div className="form-two-col">
                    <Field label="Dificultad" required={false}>
                      <select style={s.input} value={r.difficulty} onChange={e => updRoute(i, "difficulty", e.target.value)}>
                        <option value="">-</option>
                        <option value="fácil">Fácil</option><option value="moderado">Moderado</option><option value="difícil">Difícil</option>
                      </select>
                    </Field>
                    <Field label="Tipo de ruta" required={false}>
                      <select style={s.input} value={r.route_type} onChange={e => updRoute(i, "route_type", e.target.value)}>
                        <option value="">-</option>
                        <option value="circular">Circular</option><option value="ida y vuelta">Ida y vuelta</option>
                      </select>
                    </Field>
                  </div>
                  <div className="form-two-col">
                    <Field label="Nivel técnico" required={false}>
                      <select style={s.input} value={r.technical_level} onChange={e => updRoute(i, "technical_level", e.target.value)}>
                        <option value="">-</option>
                        <option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option>
                      </select>
                    </Field>
                    <Field label="Demanda física" required={false}>
                      <select style={s.input} value={r.physical_demand} onChange={e => updRoute(i, "physical_demand", e.target.value)}>
                        <option value="">-</option>
                        <option value="bajo">Baja</option><option value="medio">Media</option><option value="alto">Alta</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            <button style={s.btnAdd} onClick={() => setRoutes(prev => [...prev, defaultRoute()])}>+ Agregar ruta</button>
            <NavRow onBack={() => setStep(3)} onNext={() => setStep(5)} />
          </div>
        )}

        {/* ── Step 4/5: Images ── */}
        {step === (isTrekking ? 5 : 4) && !isService && (
          <div>
            <h2 style={s.title}>Imágenes</h2>
            <p style={{ color: "#7a7669", fontSize: 14, marginBottom: 16 }}>
              La primera imagen será la principal. Mínimo 1 imagen requerida, máximo 10.
            </p>
            <div style={s.dropzone} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
              <span style={{ color: "#7a7669", fontSize: 14 }}>
                {images.length > 0
                  ? `${images.length} imagen${images.length !== 1 ? "es" : ""} seleccionada${images.length !== 1 ? "s" : ""}`
                  : "Hacé clic para seleccionar imágenes"}
              </span>
            </div>
            {previews.length > 0 && (
              <div style={s.previewGrid}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                    <img src={src} alt={`preview ${i}`} style={s.previewImg} />
                    {i === 0 && <span style={s.mainBadge}>Principal</span>}
                  </div>
                ))}
              </div>
            )}
            <NavRow onBack={() => setStep(isTrekking ? 4 : 3)} onNext={() => setStep(summaryStep)} />
          </div>
        )}

        {/* ── Step Summary ── */}
        {step === summaryStep && (
          <div>
            <h2 style={s.title}>Revisá tu lugar</h2>

            {/* General */}
            <SummaryCard title="Información general" onEdit={() => setStep(isService ? 2 : 2)}>
              {isService ? (
                <>
                  <SummaryRow label="Categoría" value={selectedCat?.label} />
                  <SummaryRow
                    label="Lugar"
                    value={availableSpots.find(sp => sp.id === selectedSpotId)?.name}
                  />
                  {selectedCat?.name === "Surf" && surf.name && (
                    <SummaryRow label="Escuela" value={surf.name} />
                  )}
                  {selectedCat?.name === "Kayak" && kayaks[0]?.name && (
                    <SummaryRow label="Servicio" value={kayaks[0].name} />
                  )}
                </>
              ) : (
                <>
                  <SummaryRow label="Nombre" value={basic.name} />
                  <SummaryRow label="Categoría" value={selectedCat?.label} />
                  <SummaryRow label="Departamento" value={basic.department} />
                </>
              )}
            </SummaryCard>

            {/* Descripción */}
            {!isService && basic.description && (
              <SummaryCard title="Descripción" onEdit={() => setStep(2)}>
                <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0, lineHeight: 1.6 }}>
                  {basic.description.length > 120
                    ? basic.description.slice(0, 120) + "…"
                    : basic.description}
                </p>
              </SummaryCard>
            )}

            {/* Ubicación */}
            {!isService && (basic.lat || basic.lng) && (
              <SummaryCard title="Ubicación" onEdit={() => setStep(2)}>
                <SummaryRow label="Latitud" value={basic.lat} />
                <SummaryRow label="Longitud" value={basic.lng} />
              </SummaryCard>
            )}

            {/* Contacto */}
            {!isService && (basic.email || basic.whatsapp || basic.instagram) && (
              <SummaryCard title="Contacto" onEdit={() => setStep(2)}>
                {basic.email     && <SummaryRow label="Email"     value={basic.email} />}
                {basic.whatsapp  && <SummaryRow label="WhatsApp"  value={basic.whatsapp} />}
                {basic.instagram && <SummaryRow label="Instagram" value={basic.instagram} />}
              </SummaryCard>
            )}

            {/* Trekking: características */}
            {selectedCat?.name === "Trekking" && (
              <SummaryCard title="Características del lugar" onEdit={() => setStep(3)}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {TREKKING_FEATURES.map(({ key, label, emoji }) => {
                    const val = trekkingFeatures[key]
                    if (val === null) return null
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "#3d3d3a" }}>{emoji} {label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: val ? "#2d6a4f" : "#dc2626" }}>
                          {val ? "✓ Sí" : "✗ No"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </SummaryCard>
            )}

            {/* Trekking: rutas */}
            {selectedCat?.name === "Trekking" && routes.filter(r => r.name).length > 0 && (
              <SummaryCard title="Rutas" onEdit={() => setStep(3)}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {routes.filter(r => r.name).map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#1b1b19", margin: 0 }}>{r.name}</p>
                      <p style={{ fontSize: 12, color: "#7a7669", margin: 0, textAlign: "right", flexShrink: 0 }}>
                        {[r.distance_km && `${r.distance_km} km`, r.difficulty].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </SummaryCard>
            )}

            <div style={s.navRow}>
              <button style={s.btnSecondary} onClick={() => setStep(isService ? 3 : isTrekking ? 5 : 4)}>Volver</button>
              <button
                style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (uploadProgress ?? "Enviando...") : "Confirmar y enviar"}
              </button>
            </div>
            {error && <p style={s.errorText}>{error}</p>}
          </div>
        )}

      </div>
    </div>
  )
}

// ---- Sub-components ----
function Field({
  label, sublabel, required, children,
}: {
  label: string
  sublabel?: string
  required: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19" }}>
        {label}{" "}
        {required
          ? <span style={{ fontSize: 12, color: "#e53e3e", fontWeight: 400 }}>(obligatorio)</span>
          : <span style={{ fontSize: 12, color: "#9a9690", fontWeight: 400 }}>(opcional)</span>
        }
        {sublabel && (
          <div style={{ fontSize: 11, fontWeight: 400, color: "#7a7669", marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
      {children}
    </div>
  )
}

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select style={s.input} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-</option>
      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
  )
}

function SeasonToggle({
  type, onTypeChange, start, onStartChange, end, onEndChange,
}: {
  type: "all_year" | "seasonal"
  onTypeChange: (t: "all_year" | "seasonal") => void
  start: string; onStartChange: (v: string) => void
  end: string; onEndChange: (v: string) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", marginBottom: 8 }}>
        Temporada{" "}
        <span style={{ fontSize: 12, color: "#9a9690", fontWeight: 400 }}>(opcional)</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: type === "seasonal" ? 12 : 0 }}>
        {(["all_year", "seasonal"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            style={{
              padding: "6px 16px", borderRadius: 20,
              border: `1px solid ${type === t ? "#2d6a4f" : "#e0ddd6"}`,
              background: type === t ? "#2d6a4f" : "#f7f5f0",
              color: type === t ? "#fff" : "#1b1b19",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t === "all_year" ? "Todo el año" : "Por temporada"}
          </button>
        ))}
      </div>
      {type === "seasonal" && (
        <div className="form-two-col">
          <Field label="Desde" required={false}>
            <MonthSelect value={start} onChange={onStartChange} />
          </Field>
          <Field label="Hasta" required={false}>
            <MonthSelect value={end} onChange={onEndChange} />
          </Field>
        </div>
      )}
    </div>
  )
}

function TriStateToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void }) {
  const opts: { label: string; v: boolean | null; activeColor: string; activeBg: string }[] = [
    { label: "Sí",    v: true,  activeColor: "#2d6a4f", activeBg: "#2d6a4f" },
    { label: "No",    v: false, activeColor: "#dc2626", activeBg: "#dc2626" },
    { label: "No sé", v: null,  activeColor: "#7a7669", activeBg: "#7a7669" },
  ]
  return (
    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
      {opts.map(opt => {
        const active = value === opt.v
        return (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${active ? opt.activeBg : "#e0ddd6"}`,
              background: active ? opt.activeBg : "#f7f5f0",
              color: active ? "#fff" : "#9a9690",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ fontSize: 14, color: "#1b1b19", display: "flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function NavRow({
  onBack, onNext, error,
}: {
  onBack?: () => void
  onNext?: () => void
  error?: string | null
}) {
  return (
    <>
      <div style={s.navRow}>
        {onBack ? <button style={s.btnSecondary} onClick={onBack}>Atrás</button> : <div />}
        {onNext && <button style={s.btnPrimary} onClick={onNext}>Siguiente</button>}
      </div>
      {error && <p style={s.errorText}>{error}</p>}
    </>
  )
}

function SummaryCard({
  title, onEdit, children,
}: {
  title: string
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20,
      padding: "16px 20px", marginBottom: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f" }}>
            {title}
          </span>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              background: "none", border: "1px solid #e0ddd6", padding: "3px 10px",
              fontSize: 12, color: "#7a7669", cursor: "pointer",
              fontFamily: "inherit", borderRadius: 8,
            }}
          >
            Editar
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: "#9a9690", minWidth: 84, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1b1b19", fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ---- Styles ----
const mediaQuery = `
  .form-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 560px) {
    .form-two-col { grid-template-columns: 1fr; }
  }
`

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f5f0",
    display: "flex",
    justifyContent: "center",
    padding: "32px 16px 80px",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  container: { width: "100%", maxWidth: 680 },
  title: { fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 20 },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 16,
  },
  catCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "24px 16px", background: "#fff", border: "1px solid #e0ddd6",
    borderRadius: 20, cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#1b1b19",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6",
    borderRadius: 12, fontSize: 14, background: "#fff", color: "#1b1b19",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  card: {
    background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20,
    padding: "18px 20px", marginBottom: 16,
  },
  cardTitle: { fontWeight: 600, fontSize: 15, color: "#1b1b19", marginBottom: 12 },
  navRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 24, gap: 12,
  },
  btnPrimary: {
    background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 12,
    padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  btnSecondary: {
    background: "#fff", color: "#1b1b19", border: "1px solid #e0ddd6", borderRadius: 12,
    padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  btnAdd: {
    background: "transparent", color: "#2d6a4f", border: "1px solid #2d6a4f", borderRadius: 12,
    padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4,
  },
  dropzone: {
    border: "2px dashed #e0ddd6", borderRadius: 16, padding: "36px 24px",
    textAlign: "center", cursor: "pointer", background: "#fff", marginBottom: 16,
  },
  previewGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  previewImg: { width: 100, height: 80, objectFit: "cover", display: "block" },
  mainBadge: {
    position: "absolute", bottom: 4, left: 4, background: "#2d6a4f",
    color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
  },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 10 },
}
