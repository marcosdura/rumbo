"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { uploadImageToCloudinary } from "@/lib/uploadImage"
import Pill from "@/components/ui/Pill"
import { api } from "@/lib/api"
import { s, MAX_PHOTOS } from "./styles"
import type { Spot, Review, Tab } from "./types"
import InfoTab from "./InfoTab"
import PhotosTab from "./PhotosTab"
import ReviewsTab from "./ReviewsTab"

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
    Promise.all([
      api.get<Spot[]>("/spots/mine", { token }).then(r => r.data),
      api.get<Review[]>(`/reviews/${spotId}`).then(r => r.data),
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
      await api.patch(`/admin/spots/${spot.id}`, {
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
      }, { token })
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
    await api.patch(`/admin/spots/${spot.id}/main-image`, { cloudinary_public_id: publicId }, { token }).catch(() => {})
    setSpot(prev => prev ? {
      ...prev,
      images: prev.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })),
    } : null)
    setPhotoLoading(false)
  }

  async function handleDeletePhoto(publicId: string) {
    if (!spot || !confirm("¿Eliminar esta foto?")) return
    setPhotoLoading(true)
    await api.del(`/admin/images/${encodeURIComponent(publicId)}`, { token }).catch(() => {})
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
          spotId: spot.id,
        })
      ))
      await Promise.all(results.map(({ publicId }, i) =>
        api.post(`/images/spots/${spot.id}`, undefined, {
          token,
          params: { cloudinary_public_id: publicId, is_main: false, order: currentCount + i },
        })
      ))
      const { data: updated } = await api.get<Spot[]>("/spots/mine", { token })
      const found = Array.isArray(updated) ? updated.find((s: Spot) => String(s.id) === spotId) : null
      if (found) setSpot(found)
    } catch {
      setPhotoError("Error al subir fotos. Intentá de nuevo.")
    } finally {
      setUploadingPhotos(false)
    }
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

        {tab === "info" && (
          <InfoTab
            editName={editName} setEditName={setEditName}
            editDescription={editDescription} setEditDescription={setEditDescription}
            editEmail={editEmail} setEditEmail={setEditEmail}
            editWhatsapp={editWhatsapp} setEditWhatsapp={setEditWhatsapp}
            editInstagram={editInstagram} setEditInstagram={setEditInstagram}
            editPrice={editPrice} setEditPrice={setEditPrice}
            editSeasonType={editSeasonType} setEditSeasonType={setEditSeasonType}
            editSeasonStart={editSeasonStart} setEditSeasonStart={setEditSeasonStart}
            editSeasonEnd={editSeasonEnd} setEditSeasonEnd={setEditSeasonEnd}
            editIsPublic={editIsPublic} setEditIsPublic={setEditIsPublic}
            editPublicTransport={editPublicTransport} setEditPublicTransport={setEditPublicTransport}
            saving={saving} saveOk={saveOk} saveError={saveError}
            onSave={handleSave}
          />
        )}

        {tab === "fotos" && (
          <PhotosTab
            sortedImages={sortedImages}
            photoCount={photoCount}
            atPhotoLimit={atPhotoLimit}
            photoError={photoError}
            uploadingPhotos={uploadingPhotos}
            photoLoading={photoLoading}
            setPhotoError={setPhotoError}
            onUploadFiles={handleUploadPhotos}
            onSetMain={handleSetMain}
            onDeletePhoto={handleDeletePhoto}
          />
        )}

        {tab === "reviews" && <ReviewsTab reviews={reviews} />}

      </div>
    </div>
  )
}
