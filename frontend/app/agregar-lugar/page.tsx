"use client"

import { useState, useRef } from "react"
import type { CSSProperties } from "react"

// ---- Types ----
type Category = { id: number; name: string; label: string; emoji: string }
type RouteItem = {
  name: string; distance_km: string; duration_hours: string
  elevation_gain: string; elevation_loss: string; max_altitude: string; min_altitude: string
  difficulty: string; route_type: string; technical_level: string; physical_demand: string
  water_available: boolean; camping_allowed: boolean; signal: string
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

const defaultRoute = (): RouteItem => ({
  name: "", distance_km: "", duration_hours: "", elevation_gain: "", elevation_loss: "",
  max_altitude: "", min_altitude: "", difficulty: "", route_type: "",
  technical_level: "", physical_demand: "", water_available: false, camping_allowed: false, signal: "",
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
  const [step, setStep]                           = useState(1)
  const [selectedCat, setSelectedCat]             = useState<Category | null>(null)
  const [basic, setBasic]                         = useState(emptyBasic())
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [routes, setRoutes]                       = useState<RouteItem[]>([defaultRoute()])
  const [sectors, setSectors]                     = useState<SectorItem[]>([defaultSector()])
  const [surf, setSurf]                           = useState<SurfItem>(defaultSurf())
  const [kayaks, setKayaks]                       = useState<KayakItem[]>([defaultKayak()])
  const [images, setImages]                       = useState<File[]>([])
  const [previews, setPreviews]                   = useState<string[]>([])
  const [submitting, setSubmitting]               = useState(false)
  const [uploadProgress, setUploadProgress]       = useState<string | null>(null)
  const [error, setError]                         = useState<string | null>(null)
  const [success, setSuccess]                     = useState(false)
  const fileRef                                   = useRef<HTMLInputElement>(null)
  const [selectedSpotId, setSelectedSpotId]       = useState<number | null>(null)
  const [availableSpots, setAvailableSpots]       = useState<{ id: number; name: string }[]>([])
  const [loadingSpots, setLoadingSpots]           = useState(false)
  const isService = selectedCat?.name === "Surf" || selectedCat?.name === "Kayak"

  function upd(field: string, val: string) {
    setBasic(prev => ({ ...prev, [field]: val }))
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
    setError(null)
    setStep(3)
  }

  async function handleSubmit() {
    const cat = selectedCat!.name
    if (isService) {
      setError(null)
      setSubmitting(true)
      try {
        if (cat === "Surf" && surf.name) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surfschool/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              spot_id: selectedSpotId,
              name: surf.name,
              class_type: surf.class_type || null,
              duration: surf.duration ? parseFloat(surf.duration) : null,
              equipment_include: surf.equipment_include,
              season_start: surf.season_type === "seasonal" && surf.season_start ? parseInt(surf.season_start) : null,
              season_end:   surf.season_type === "seasonal" && surf.season_end   ? parseInt(surf.season_end)   : null,
              email: surf.email || null, whatsapp: surf.whatsapp || null, instagram: surf.instagram || null,
            }),
          })
          if (!res.ok) throw new Error("Error al guardar la escuelita")
        }
        if (cat === "Kayak") {
          for (const k of kayaks) {
            if (!k.name) continue
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kayak/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                spot_id: selectedSpotId,
                name: k.name,
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
      }
      return
    }

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
        headers: { "Content-Type": "application/json" },
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
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${spotId}?${params}`, { method: "POST" })
      }

      // 4. Category-specific records
      if ((cat === "Camping" || cat === "Glamping") && selectedAmenities.length > 0) {
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
              water_available: r.water_available, camping_allowed: r.camping_allowed,
              signal: r.signal || null,
            }),
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
    setSurf(defaultSurf()); setKayaks([defaultKayak()])
    setImages([]); setPreviews([]); setError(null); setSuccess(false)
    setSelectedSpotId(null); setAvailableSpots([])
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
        <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 28, textAlign: "center" }}>Paso {step} de {isService ? 3 : 4}</p>

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
              <div className="form-two-col">
                <Field label="Latitud" required={false}>
                  <input style={s.input} type="number" step="any" value={basic.lat} onChange={e => upd("lat", e.target.value)} />
                </Field>
                <Field label="Longitud" required={false}>
                  <input style={s.input} type="number" step="any" value={basic.lng} onChange={e => upd("lng", e.target.value)} />
                </Field>
              </div>
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

            {/* Trekking */}
            {selectedCat?.name === "Trekking" && (
              <div>
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
                      <div className="form-two-col">
                        <Field label="Señal" required={false}>
                          <select style={s.input} value={r.signal} onChange={e => updRoute(i, "signal", e.target.value)}>
                            <option value="">-</option>
                            <option value="none">Sin señal</option><option value="low">Baja</option><option value="medium">Media</option>
                          </select>
                        </Field>
                        <div />
                      </div>
                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                        <Toggle label="Agua disponible" checked={r.water_available} onChange={v => updRoute(i, "water_available", v)} />
                        <Toggle label="Acampar permitido" checked={r.camping_allowed} onChange={v => updRoute(i, "camping_allowed", v)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button style={s.btnAdd} onClick={() => setRoutes(prev => [...prev, defaultRoute()])}>+ Agregar ruta</button>
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
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isService ? (
              <>
                <div style={s.navRow}>
                  <button style={s.btnSecondary} onClick={() => setStep(2)}>Atrás</button>
                  <button
                    style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                  </button>
                </div>
                {error && <p style={s.errorText}>{error}</p>}
              </>
            ) : (
              <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} />
            )}
          </div>
        )}

        {/* ── Step 4: Images ── */}
        {step === 4 && (
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
            <div style={s.navRow}>
              <button style={s.btnSecondary} onClick={() => setStep(3)}>Atrás</button>
              <button
                style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (uploadProgress ?? "Enviando...") : "Enviar lugar"}
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
