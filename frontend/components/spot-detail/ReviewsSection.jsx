"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StarDisplay, StarPicker } from "@/components/ui/StarRating"
import Toast from "@/components/ui/Toast"
import AuthModal from "@/components/layout/AuthModal"

const API = process.env.NEXT_PUBLIC_API_URL

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr + "Z").getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`
  return new Date(dateStr).toLocaleDateString("es-UY", { month: "short", year: "numeric" })
}

function Avatar({ user, size = 36 }) {
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #52b788, #1b4332)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 600, color: "#fff",
    }}>
      {initials}
    </div>
  )
}

export default function ReviewsSection({ spotId }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const userId = session?.user?.id
  const token = session?.id_token

  const loadReviews = async () => {
    try {
      const [revRes, sumRes] = await Promise.all([
        fetch(`${API}/reviews/${spotId}`),
        fetch(`${API}/reviews/${spotId}/summary`),
      ])
      const revData = await revRes.json()
      setReviews(Array.isArray(revData) ? revData : [])
      setSummary(await sumRes.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadReviews() }, [spotId])

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/reviews/${spotId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      })
      if (res.ok) {
        setRating(0)
        setComment("")
        setShowForm(false)
        loadReviews()
      }
    } catch {}
    setSubmitting(false)
  }

  const handleDelete = async (reviewId) => {
    try {
      await fetch(`${API}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      loadReviews()
    } catch {}
  }

  return (
    <>
      <style>{`
        .reviews-wrap {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          font-family: 'DM Sans', sans-serif;
        }

        /* Header: título+rating a la izq, botón a la der */
        .reviews-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
        }

        .reviews-write-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 12px;
          border: 1px solid #e0ddd6;
          background: #fff;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          color: #1b4332;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (hover: hover) {
          .reviews-write-btn:hover {
            background: #f0f7f3;
            transform: translateY(-1px);
          }
        }

        /* Review card */
        .review-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 16px;
          padding: 16px 20px;
        }
        .review-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .review-card-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .review-card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .reviews-delete-btn {
          font-size: 11px;
          color: #9a9690;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
          padding: 0;
        }
        @media (hover: hover) {
          .reviews-delete-btn:hover { color: #dc2626; }
        }

        /* Form actions */
        .reviews-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          justify-content: flex-end;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .reviews-wrap { padding: 20px 16px; }

          .reviews-header { flex-direction: column; align-items: stretch; }
          .reviews-write-btn { justify-content: center; }

          .reviews-form-actions { flex-direction: column-reverse; }
          .reviews-form-actions button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="reviews-wrap">

        {/* Header */}
        <div className="reviews-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                Reseñas
              </span>
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
              Reviews
            </p>
            {summary?.total > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#1b1b19", lineHeight: 1 }}>
                  {summary.average}
                </span>
                <div>
                  <StarDisplay rating={Math.round(summary.average)} />
                  <p style={{ fontSize: 12, color: "#9a9690", marginTop: 2 }}>
                    {summary.total} review{summary.total !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!showForm && (
            <button
              className="reviews-write-btn"
              onClick={() => { if (!token) { setShowAuth(true); return } setShowForm(true) }}
            >
              ✏️ Escribir review
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div style={{ background: "#f7f5f0", border: "1px solid #e0ddd6", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2d6a4f", marginBottom: 10 }}>
              Tu rating
            </p>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              style={{
                width: "100%", border: "1px solid #e0ddd6", borderRadius: 12,
                padding: "12px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                color: "#1b1b19", background: "#fff", resize: "none", outline: "none",
                transition: "border-color 0.2s", marginTop: 14, boxSizing: "border-box",
              }}
              rows={3}
              placeholder="Contá tu experiencia (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={e => e.target.style.borderColor = "#2d6a4f"}
              onBlur={e => e.target.style.borderColor = "#e0ddd6"}
            />
            <div className="reviews-form-actions">
              <button
                style={{
                  padding: "9px 16px", borderRadius: 12, fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
                  background: "none", color: "#9a9690", border: "1px solid #e0ddd6", cursor: "pointer",
                }}
                onClick={() => { setShowForm(false); setRating(0); setComment("") }}
              >
                Cancelar
              </button>
              <button
                style={{
                  padding: "9px 20px", borderRadius: 12, fontSize: 14,
                  fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  background: "#1b4332", color: "#fff", border: "none",
                  cursor: !rating || submitting ? "not-allowed" : "pointer",
                  opacity: !rating || submitting ? 0.45 : 1,
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onClick={handleSubmit}
                disabled={!rating || submitting}
              >
                {submitting ? "Enviando..." : "Publicar review"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#9a9690", fontSize: 14 }}>
            Cargando...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#9a9690", fontSize: 14 }}>
            <p style={{ fontSize: 28, marginBottom: 10, opacity: 0.25 }}>💬</p>
            Todavía no hay reviews. ¡Sé el primero!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-card-top">
                  <div className="review-card-user">
                    <Avatar user={review.user} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                        {review.user?.name || "Usuario"}
                      </p>
                      <p style={{ fontSize: 11, color: "#9a9690", marginTop: 2 }}>
                        {timeAgo(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="review-card-actions">
                    <StarDisplay rating={review.rating} size={14} />
                    {review.user?.id === userId && (
                      <button
                        className="reviews-delete-btn"
                        onClick={() => handleDelete(review.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ fontSize: 14, color: "#3d3d3a", lineHeight: 1.65, marginTop: 10 }}>
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
