"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Navbar from "@/components/layout/Navbar"
import LoadingScreen from "@/components/ui/LoadingScreen"
import Footer from "@/components/layout/Footer"
import { StarDisplay, StarPicker } from "@/components/ui/StarRating"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api } from "@/lib/api"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr + "Z").getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`
  return new Date(dateStr).toLocaleDateString("es-UY", { month: "short", year: "numeric" })
}

export default function ReviewsPage() {
  const { data: session, status } = useSession()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Edición inline: id de la review abierta, más sus campos en edición.
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const token = session?.id_token

  const loadReviews = async () => {
    try {
      const { data } = await api.get<any[]>("/reviews/user/me", { token })
      setReviews(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (status === "loading") return
    if (token) loadReviews()
    else setLoading(false)
  }, [token, status])

  const handleDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.del(`/reviews/${deleteTargetId}`, { token })
      setReviews(prev => prev.filter(r => r.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch {
      // El modal queda abierto con el error adentro, para poder reintentar.
      setDeleteError("No se pudo eliminar la review. Intentá de nuevo.")
    }
    setDeleting(false)
  }

  const startEditing = (review: any) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment ?? "")
    setSaveError(false)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditRating(0)
    setEditComment("")
    setSaveError(false)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editRating) return
    setSaving(true)
    setSaveError(false)
    try {
      const { data } = await api.patch<any>(
        `/reviews/${editingId}`,
        { rating: editRating, comment: editComment },
        { token },
      )
      setReviews(prev => prev.map(r =>
        r.id === editingId
          ? { ...r, rating: data.rating, comment: data.comment, updated_at: data.updated_at }
          : r
      ))
      cancelEditing()
    } catch {
      setSaveError(true)
    }
    setSaving(false)
  }

  if (status === "loading" || loading) return <LoadingScreen />

  // si no esta logueado
  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            background: "#fff", border: "1px solid var(--border)",
            borderRadius: 20, padding: "60px 48px",
            textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            maxWidth: 400,
          }}>
            <p style={{ fontSize: 40, marginBottom: 16, opacity: 0.25 }}>💬</p>
            <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 8 }}>
              Iniciá sesión
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              Iniciá sesión para ver tus reviews
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`

        .review-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
        }

        .review-spot-link {
          font-family: var(--font-playfair-display), serif;
          font-size: 17px;
          font-weight: 600;
          color: #1b1b19;
          text-decoration: none;
          transition: color 0.15s;
        }
        .review-spot-link:hover { color: var(--primary); }

        .delete-btn,
        .edit-btn {
          font-size: 12px;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: var(--font-dm-sans), sans-serif;
          transition: color 0.15s;
        }
        .delete-btn:hover { color: var(--danger); }
        .edit-btn:hover { color: var(--primary); }

        .explore-btn:hover {
          background: var(--primary) !important;
          transform: translateY(-1px);
        }

        .reviews-wrapper { max-width: 768px; margin: 0 auto; padding: 40px 24px 64px; min-height: calc(100vh - 200px); }
        .reviews-title   { font-family: var(--font-playfair-display), serif; font-size: 36px; font-weight: 600; color: #1b1b19; margin: 0; line-height: 1.2; }
        .review-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .review-card-meta   { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

        @media (max-width: 640px) {
          .reviews-wrapper    { padding: 24px 16px 48px; }
          .reviews-title      { font-size: 26px; }
          .review-card-header { flex-direction: column; gap: 8px; }
          .review-card-meta   { flex-direction: row-reverse; justify-content: flex-end; }
        }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="reviews-wrapper">

          {/* Header */}
          <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                Tu actividad
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <h1 className="reviews-title">Mis reviews</h1>
              {reviews.length > 0 && (
                <Pill variant="dark-green" hover style={{ fontSize: 12, padding: "3px 12px", flexShrink: 0 }}>
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </Pill>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="fade-up fade-up-1" style={{ height: 1, background: "var(--border)", marginBottom: 28 }} />

          {/* Estado vacío */}
          {reviews.length === 0 && (
            <div className="fade-up fade-up-2" style={{
              background: "#fff", border: "1px solid var(--border)",
              borderRadius: 20, padding: "64px 40px",
              textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <p style={{ fontSize: 44, marginBottom: 16, opacity: 0.25 }}>💬</p>
              <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 8 }}>
                Todavía no escribiste reviews
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
                Visitá un spot y contá tu experiencia
              </p>
              <Link href="/search" className="explore-btn" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 22px", borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                background: "var(--primary-dark)", color: "#fff",
                textDecoration: "none",
                transition: "background 0.2s, transform 0.2s",
              }}>
                Explorar spots →
              </Link>
            </div>
          )}

          {/* Lista */}
          {reviews.length > 0 && (
            <div className="fade-up fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <div>
                      <Link href={`/spots/${review.spot_slug || review.spot_id}`} className="review-spot-link">
                        {review.spot_name || `Spot #${review.spot_id}`}
                      </Link>
                      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        {timeAgo(review.created_at)}
                        {review.updated_at && " · editado"}
                      </p>
                    </div>
                    <div className="review-card-meta">
                      <StarDisplay rating={review.rating} size={14} />
                      {editingId !== review.id && (
                        <>
                          <button className="edit-btn" onClick={() => startEditing(review)}>
                            Editar
                          </button>
                          <button className="delete-btn" onClick={() => setDeleteTargetId(review.id)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === review.id ? (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 8 }}>
                        Editar tu review
                      </p>
                      <StarPicker value={editRating} onChange={setEditRating} />
                      <textarea
                        rows={3}
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                        placeholder="Contá tu experiencia (opcional)..."
                        style={{
                          width: "100%", border: "1px solid var(--border)", borderRadius: 12,
                          padding: "10px 12px", fontSize: 14,
                          fontFamily: "var(--font-dm-sans), sans-serif",
                          color: "#1b1b19", background: "#fff", resize: "none", outline: "none",
                          marginTop: 12, boxSizing: "border-box",
                        }}
                      />
                      {saveError && (
                        <p style={{ fontSize: 13, color: "var(--danger)", margin: "10px 0 0" }}>
                          No se pudo guardar el cambio. Revisá tu conexión y probá de nuevo.
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                        <button
                          onClick={cancelEditing}
                          style={{
                            padding: "8px 16px", borderRadius: 12, fontSize: 13,
                            fontFamily: "var(--font-dm-sans), sans-serif",
                            background: "none", color: "var(--muted)",
                            border: "1px solid var(--border)", cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editRating || saving}
                          style={{
                            padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                            fontFamily: "var(--font-dm-sans), sans-serif",
                            background: "var(--primary-dark)", color: "#fff", border: "none",
                            cursor: !editRating || saving ? "not-allowed" : "pointer",
                            opacity: !editRating || saving ? 0.45 : 1,
                          }}
                        >
                          {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    review.comment && (
                      <p style={{ fontSize: 14, color: "#3d3d3a", lineHeight: 1.65, marginTop: 10 }}>
                        {review.comment}
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
        <Footer />
      </div>

      <ConfirmModal
        open={deleteTargetId !== null}
        title="¿Eliminar tu review?"
        message="Esta acción no se puede deshacer."
        error={deleteError}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTargetId(null); setDeleteError(null) }}
      />
    </div>
  )
}