"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import Pill from "@/components/ui/Pill"

type SpotImage = { cloudinary_public_id: string; is_main: boolean; order: number }
type Review = {
  id: number; rating: number; comment: string | null; created_at: string
  user: { name: string | null; image: string | null }
}
type Spot = {
  id: number; name: string; slug: string | null; description: string
  department: string; email: string | null; whatsapp: string | null
  instagram: string | null; price: number | null
  season_start: number | null; season_end: number | null
  is_public: boolean | null; public_transport: string | null
  is_approved: boolean; category: { name: string } | null
  images: SpotImage[]; average_rating: number | null; review_count: number
}

type Tab = "info" | "fotos" | "reviews"

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre",
]

const MAX_PHOTOS = 10

export default function SpotDashboardPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const spotId = params.id as string
  const token = session?.id_token

  const [spot, setSpot] = useState<Spot | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("info")
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoUploadRef = useRef<HTMLInputElement>(null)

  // Campos editables
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editWhatsapp, setEditWhatsapp] = useState("")
  const [editInstagram, setEditInstagram] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editSeasonType, setEditSeasonType] = useState<"all_year" | "seasonal">("all_year")
  const [editSeasonStart, setEditSeasonStart] = useState("")
  const [editSeasonEnd, setEditSeasonEnd] = useState("")
  const [editIsPublic, setEditIsPublic] = useState<boolean | null>(null)
  const [editPublicTransport, setEditPublicTransport] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/"); return }
  }, [session, status])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/mine`, { headers }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${spotId}`).then(r => r.json()),
    ]).then(([mySpots, reviewsData]) => {
      const found = Array.isArray(mySpots) ? mySpots.find((s: Spot) => String(s.id) === spotId) : null
      if (!found) { router.push("/profile"); return }
      setSpot(found)
      populateFields(found)
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      setLoading(false)
    })
  }, [token, spotId])

  function populateFields(s: Spot) {
    setEditName(s.name ?? "")
    setEditDescription(s.description ?? "")
    setEditEmail(s.email ?? "")
    setEditWhatsapp(s.whatsapp ?? "")
    setEditInstagram(s.instagram ?? "")
    setEditPrice(s.price != null ? String(s.price) : "")
    setEditSeasonType(s.season_start ? "seasonal" : "all_year")
    setEditSeasonStart(s.season_start ? String(s.season_start) : "")
    setEditSeasonEnd(s.season_end ? String(s.season_end) : "")
    setEditIsPublic(s.is_public ?? null)
    setEditPublicTransport(s.public_transport ?? null)
  }

  async function handleSave() {
    if (!spot) return
    setSaving(true)
    setSaveOk(false)
    setSaveError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${spot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          email: editEmail || null,
          whatsapp: editWhatsapp || null,
          instagram: editInstagram || null,
          price: editPrice !== "" ? parseFloat(editPrice) : null,
          season_start: editSeasonType === "seasonal" && editSeasonStart ? parseInt(editSeasonStart) : null,
          season_end: editSeasonType === "seasonal" && editSeasonEnd ? parseInt(editSeasonEnd) : null,
          is_public: editIsPublic,
          public_transport: editPublicTransport,
        }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      setSpot(prev => prev ? {
        ...prev,
        name: editName, description: editDescription,
        email: editEmail || null, whatsapp: editWhatsapp || null, instagram: editInstagram || null,
        price: editPrice !== "" ? parseFloat(editPrice) : null,
        season_start: editSeasonType === "seasonal" && editSeasonStart ? parseInt(editSeasonStart) : null,
        season_end: editSeasonType === "seasonal" && editSeasonEnd ? parseInt(editSeasonEnd) : null,
        is_public: editIsPublic, public_transport: editPublicTransport,
      } : null)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2500)
    } catch {
      setSaveError("No se pudo guardar. Intentá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSetMain(publicId: string) {
    if (!spot) return
    setPhotoLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${spot.id}/main-image`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ cloudinary_public_id: publicId }),
    })
    setSpot(prev => prev ? {
      ...prev,
      images: prev.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })),
    } : null)
    setPhotoLoading(false)
  }

  async function handleDeletePhoto(publicId: string) {
    if (!spot || !confirm("¿Eliminar esta foto?")) return
    setPhotoLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/images/${encodeURIComponent(publicId)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpot(prev => prev ? { ...prev, images: prev.images.filter(img => img.cloudinary_public_id !== publicId) } : null)
    setPhotoLoading(false)
  }

  async function handleUploadPhotos(files: File[]) {
    if (!spot) return
    const currentCount = spot.images?.length ?? 0
    const available = MAX_PHOTOS - currentCount
    if (available <= 0) {
      setPhotoError("Ya alcanzaste el límite de 10 fotos para este spot.")
      return
    }
    const filesToUpload = files.slice(0, available)
    if (filesToUpload.length < files.length) {
      setPhotoError(`Solo se subieron ${filesToUpload.length} foto${filesToUpload.length !== 1 ? "s" : ""} para no superar el límite de 10.`)
    } else {
      setPhotoError(null)
    }
    setUploadingPhotos(true)
    try {
      const results = await Promise.all(filesToUpload.map((file, i) =>
        uploadImageToCloudinary(file, {
          category: spot.category?.name ?? "Spot",
          spotName: spot.name,
          index: currentCount + i,
        })
      ))
      await Promise.all(results.map(({ publicId }, i) => {
        const p = new URLSearchParams({
          cloudinary_public_id: publicId,
          is_main: "false",
          order: String(currentCount + i),
        })
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${spot.id}?${p}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      }))
      const updated = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json())
      const found = Array.isArray(updated) ? updated.find((s: Spot) => String(s.id) === spotId) : null
      if (found) setSpot(found)
    } catch {
      setPhotoError("Error al subir fotos. Intentá de nuevo.")
    } finally {
      setUploadingPhotos(false)
      if (photoUploadRef.current) photoUploadRef.current.value = ""
    }
  }

  const s = {
    card: { background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    label: { fontSize: 12, fontWeight: 600 as const, color: "#7a7669", marginBottom: 4, display: "block" as const },
    input: { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const, background: "#fff" },
    tab: (active: boolean) => ({
      padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600 as const,
      cursor: "pointer" as const, fontFamily: "inherit",
      border: `1px solid ${active ? "#2d6a4f" : "#e0ddd6"}`,
      background: active ? "#2d6a4f" : "#fff",
      color: active ? "#fff" : "#3d3d3a",
    }),
    pill: (active: boolean, danger = false) => ({
      padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500 as const,
      cursor: "pointer" as const, fontFamily: "inherit",
      border: `1px solid ${active ? (danger ? "#dc2626" : "#2d6a4f") : "#e0ddd6"}`,
      background: active ? (danger ? "#dc2626" : "#2d6a4f") : "#f7f5f0",
      color: active ? "#fff" : "#3d3d3a",
    }),
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <p style={{ color: "#9a9690", fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!spot) return null

  const sortedImages = [...(spot.images ?? [])].sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
  const photoCount = spot.images?.length ?? 0
  const atPhotoLimit = photoCount >= MAX_PHOTOS

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
        .photo-card { border-radius: 12px; overflow: hidden; border: 1px solid #e0ddd6; position: relative; background: #f0ede8; }
        .photo-card img { width: 100%; height: 110px; object-fit: cover; display: block; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/profile" style={{ fontSize: 13, color: "#9a9690", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            ← Volver al perfil
          </Link>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: "#1b1b19", margin: "0 0 6px" }}>
                {spot.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Pill variant={spot.is_approved ? "green" : "yellow"} size="sm">
                  {spot.is_approved ? "✓ Aprobado" : "⏳ Pendiente de aprobación"}
                </Pill>
                {spot.category && (
                  <span style={{ fontSize: 12, color: "#9a9690" }}>{spot.category.name} · {spot.department}</span>
                )}
              </div>
            </div>
            {spot.slug && (
              <a href={`/spots/${spot.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid #e0ddd6", background: "#fff", color: "#3d3d3a", textDecoration: "none" }}>
                Ver spot →
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Reseñas", value: spot.review_count ?? 0, emoji: "💬" },
            { label: "Calificación", value: spot.average_rating ? `${spot.average_rating} ★` : "—", emoji: "⭐" },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f7f5f0", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {stat.emoji}
              </div>
              <div>
                <p style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 600, color: "#1b1b19", margin: "0 0 2px", lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: "#9a9690", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {([
            { id: "info", label: "✏️ Información" },
            { id: "fotos", label: `📷 Fotos (${photoCount}/${MAX_PHOTOS})` },
            { id: "reviews", label: `💬 Reseñas (${reviews.length})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={s.tab(tab === t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Info */}
        {tab === "info" && (
          <div style={{ ...s.card, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={s.label}>Nombre</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={s.input} />
              </div>

              <div>
                <label style={s.label}>Descripción</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={5} style={{ ...s.input, resize: "vertical" }} />
              </div>

              {/* Separador */}
              <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", margin: "0 0 12px" }}>Contacto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={s.label}>Email</label>
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={s.input} type="email" placeholder="email@ejemplo.com" />
                  </div>
                  <div>
                    <label style={s.label}>WhatsApp</label>
                    <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} style={s.input} placeholder="+598 99 000 000" />
                  </div>
                  <div>
                    <label style={s.label}>Instagram</label>
                    <input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} style={s.input} placeholder="@usuario" />
                  </div>
                </div>
              </div>

              {/* Precio y temporada */}
              <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", margin: "0 0 12px" }}>Precio y temporada</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={s.label}>Precio (UYU) — poné 0 si es gratis</label>
                    <input value={editPrice} onChange={e => setEditPrice(e.target.value)} style={s.input} type="number" min={0} placeholder="0" />
                  </div>
                  <div>
                    <label style={s.label}>Temporada</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      {([
                        { value: "all_year", label: "🗓️ Todo el año" },
                        { value: "seasonal", label: "📅 Temporada específica" },
                      ] as { value: "all_year" | "seasonal"; label: string }[]).map(opt => (
                        <button key={opt.value} type="button" onClick={() => setEditSeasonType(opt.value)} style={s.pill(editSeasonType === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {editSeasonType === "seasonal" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={s.label}>Desde</label>
                          <select value={editSeasonStart} onChange={e => setEditSeasonStart(e.target.value)} style={s.input}>
                            <option value="">Mes...</option>
                            {MONTHS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={s.label}>Hasta</label>
                          <select value={editSeasonEnd} onChange={e => setEditSeasonEnd(e.target.value)} style={s.input}>
                            <option value="">Mes...</option>
                            {MONTHS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Acceso */}
              <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", margin: "0 0 12px" }}>Acceso</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={s.label}>¿El lugar es público o privado?</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {([
                        { value: true, label: "🏛️ Público" },
                        { value: false, label: "🔒 Privado" },
                      ] as { value: boolean; label: string }[]).map(opt => (
                        <button key={String(opt.value)} type="button" onClick={() => setEditIsPublic(opt.value)} style={s.pill(editIsPublic === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={s.label}>¿Accesible en transporte público?</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {([
                        { value: "si", label: "✅ Sí" },
                        { value: "no", label: "❌ No" },
                        { value: "nose", label: "🤷 No sé" },
                      ] as { value: string; label: string }[]).map(opt => (
                        <button key={opt.value} type="button" onClick={() => setEditPublicTransport(prev => prev === opt.value ? null : opt.value)} style={s.pill(editPublicTransport === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardar */}
              <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                {saveOk && <span style={{ fontSize: 13, color: "#2d6a4f", fontWeight: 600 }}>✓ Guardado correctamente</span>}
                {saveError && <span style={{ fontSize: 13, color: "#dc2626" }}>{saveError}</span>}
              </div>

            </div>
          </div>
        )}

        {/* Tab: Fotos */}
        {tab === "fotos" && (
          <div style={{ ...s.card, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: "#7a7669", margin: 0 }}>
                {photoCount} de {MAX_PHOTOS} fotos · {atPhotoLimit ? "Límite alcanzado" : `Podés agregar ${MAX_PHOTOS - photoCount} más`}
              </p>
              <button
                onClick={() => { setPhotoError(null); photoUploadRef.current?.click() }}
                disabled={uploadingPhotos || atPhotoLimit}
                style={{
                  padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: atPhotoLimit ? "not-allowed" : "pointer",
                  fontFamily: "inherit", background: atPhotoLimit ? "#f0ede8" : "#2d6a4f",
                  color: atPhotoLimit ? "#b0ac9e" : "#fff", border: "none",
                  opacity: uploadingPhotos ? 0.6 : 1,
                }}
              >
                {uploadingPhotos ? "Subiendo..." : atPhotoLimit ? "Límite alcanzado" : "+ Agregar fotos"}
              </button>
              <input
                ref={photoUploadRef}
                type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) handleUploadPhotos(files)
                }}
              />
            </div>
            {photoError && (
              <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 12px" }}>{photoError}</p>
            )}
            <div className="photo-grid">
              {sortedImages.map(img => (
                <div key={img.cloudinary_public_id} className="photo-card">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_280,h_220,c_fill/${img.cloudinary_public_id}`}
                    alt=""
                  />
                  {img.is_main && (
                    <div style={{ position: "absolute", top: 6, left: 6, background: "#2d6a4f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                      Principal
                    </div>
                  )}
                  <div style={{ padding: "8px 8px 6px", display: "flex", gap: 5 }}>
                    {!img.is_main && (
                      <button
                        onClick={() => handleSetMain(img.cloudinary_public_id)}
                        disabled={photoLoading}
                        style={{ flex: 1, padding: "4px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#e8f5ee", color: "#1b4332", border: "1px solid #b7dfc8" }}
                      >
                        Principal
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(img.cloudinary_public_id)}
                      disabled={photoLoading}
                      style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#dc2626", border: "1px solid #fecaca" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Reviews */}
        {tab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.length === 0 ? (
              <div style={{ ...s.card, padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#9a9690", margin: 0 }}>Todavía no hay reseñas para este spot.</p>
              </div>
            ) : reviews.map(review => (
              <div key={review.id} style={{ ...s.card, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#f7f5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    {review.user.image
                      ? <img src={review.user.image} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "👤"
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px" }}>
                      {review.user.name ?? "Usuario"}
                    </p>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ fontSize: 13, color: n <= review.rating ? "#f59e0b" : "#e0ddd6" }}>★</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#9a9690", flexShrink: 0 }}>
                    {new Date(review.created_at).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {review.comment && (
                  <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0, lineHeight: 1.6 }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
