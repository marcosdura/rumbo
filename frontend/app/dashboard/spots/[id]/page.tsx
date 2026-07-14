"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { uploadImageToCloudinary } from "@/lib/uploadImage"

type SpotImage = { cloudinary_public_id: string; is_main: boolean; order: number }
type Review = { id: number; rating: number; comment: string | null; created_at: string; user: { name: string | null; image: string | null } }
type Spot = {
  id: number; name: string; slug: string | null; description: string
  department: string; email: string | null; whatsapp: string | null
  instagram: string | null; is_approved: boolean; category: { name: string } | null
  images: SpotImage[]; average_rating: number | null; review_count: number
}

type Tab = "info" | "fotos" | "reviews"

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
  const [photoLoading, setPhotoLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoUploadRef = useRef<HTMLInputElement>(null)

  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editWhatsapp, setEditWhatsapp] = useState("")
  const [editInstagram, setEditInstagram] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/"); return }
  }, [session, status])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/mine`, { headers }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${spotId}`, { headers }).then(r => r.json()),
    ]).then(([mySpots, reviewsData]) => {
      const found = Array.isArray(mySpots) ? mySpots.find((s: Spot) => String(s.id) === spotId) : null
      if (!found) { router.push("/profile"); return }
      setSpot(found)
      setEditName(found.name)
      setEditDescription(found.description ?? "")
      setEditEmail(found.email ?? "")
      setEditWhatsapp(found.whatsapp ?? "")
      setEditInstagram(found.instagram ?? "")
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      setLoading(false)
    })
  }, [token, spotId])

  async function handleSaveInfo() {
    if (!spot) return
    setSaving(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${spot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: editName, description: editDescription, email: editEmail, whatsapp: editWhatsapp, instagram: editInstagram }),
    })
    setSpot(prev => prev ? { ...prev, name: editName, description: editDescription, email: editEmail, whatsapp: editWhatsapp, instagram: editInstagram } : null)
    setSaving(false)
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2500)
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
    setUploadingPhotos(true)
    try {
      const results = await Promise.all(files.map((file, i) =>
        uploadImageToCloudinary(file, {
          category: spot.category?.name ?? "Spot",
          spotName: spot.name,
          index: (spot.images?.length ?? 0) + i,
        })
      ))
      await Promise.all(results.map(({ publicId }, i) => {
        const query = new URLSearchParams({
          cloudinary_public_id: publicId,
          is_main: "false",
          order: String((spot.images?.length ?? 0) + i),
        })
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/spots/${spot.id}?${query}`, {
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
      alert("Error al subir fotos")
    } finally {
      setUploadingPhotos(false)
      if (photoUploadRef.current) photoUploadRef.current.value = ""
    }
  }

  const s = {
    card: { background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    label: { fontSize: 12, fontWeight: 600 as const, color: "#7a7669", marginBottom: 4 },
    input: { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const },
    tab: (active: boolean) => ({
      padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600 as const,
      cursor: "pointer" as const, fontFamily: "inherit", border: `1px solid ${active ? "#2d6a4f" : "#e0ddd6"}`,
      background: active ? "#2d6a4f" : "#fff", color: active ? "#fff" : "#3d3d3a",
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

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
        .photo-card { border-radius: 12px; overflow: hidden; border: 1px solid #e0ddd6; position: relative; background: #f0ede8; }
        .photo-card img { width: 100%; height: 110px; object-fit: cover; display: block; }
        .star-filled { color: #f59e0b; }
        .star-empty { color: #e0ddd6; }
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
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>
                {spot.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                  background: spot.is_approved ? "#e8f5ee" : "#fef3cd",
                  color: spot.is_approved ? "#1b4332" : "#92400e",
                }}>
                  {spot.is_approved ? "✓ Aprobado" : "⏳ Pendiente de aprobación"}
                </span>
                {spot.category && (
                  <span style={{ fontSize: 12, color: "#9a9690" }}>{spot.category.name} · {spot.department}</span>
                )}
              </div>
            </div>
            {spot.slug && (
              <a
                href={`/spots/${spot.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid #e0ddd6", background: "#fff", color: "#3d3d3a", textDecoration: "none" }}
              >
                Ver spot →
              </a>
            )}
          </div>
        </div>

        {/* Stats rápidas */}
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
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([
            { id: "info", label: "✏️ Información" },
            { id: "fotos", label: "📷 Fotos" },
            { id: "reviews", label: `💬 Reseñas (${reviews.length})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={s.tab(tab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {tab === "info" && (
          <div style={{ ...s.card, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={s.label}>Nombre</p>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={s.input} />
              </div>
              <div>
                <p style={s.label}>Descripción</p>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={5}
                  style={{ ...s.input, resize: "vertical" }}
                />
              </div>
              <div>
                <p style={s.label}>Email</p>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={s.input} type="email" />
              </div>
              <div>
                <p style={s.label}>WhatsApp</p>
                <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} style={s.input} />
              </div>
              <div>
                <p style={s.label}>Instagram</p>
                <input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} style={s.input} placeholder="@usuario" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleSaveInfo}
                  disabled={saving}
                  style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                {saveOk && <span style={{ fontSize: 13, color: "#2d6a4f", fontWeight: 600 }}>✓ Guardado</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Fotos */}
        {tab === "fotos" && (
          <div style={{ ...s.card, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <p style={{ fontSize: 13, color: "#7a7669", margin: 0 }}>
                {spot.images?.length ?? 0} foto{(spot.images?.length ?? 0) !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => photoUploadRef.current?.click()}
                disabled={uploadingPhotos}
                style={{ padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#2d6a4f", color: "#fff", border: "none", opacity: uploadingPhotos ? 0.6 : 1 }}
              >
                {uploadingPhotos ? "Subiendo..." : "+ Agregar fotos"}
              </button>
              <input
                ref={photoUploadRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={e => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) handleUploadPhotos(files)
                }}
              />
            </div>
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
                    {review.user.image ? (
                      <img src={review.user.image} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : "👤"}
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
                  <span style={{ fontSize: 11, color: "#9a9690" }}>
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
