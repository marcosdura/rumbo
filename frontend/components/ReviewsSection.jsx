"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StarDisplay, StarPicker } from "@/components/StarRating"
import { createPortal } from "react-dom"
import Toast from "@/components/Toast"
import AuthModal from "@/components/AuthModal"


const API = "http://localhost:8000"

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
      background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 500, color: "#fff",
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

  // Form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const userId = session?.user?.id

  // ─── Cargar reviews ────────────────────────────────────────────────────────
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

  // ─── Enviar review ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/reviews/${spotId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, rating, comment }),
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

  // ─── Borrar review ─────────────────────────────────────────────────────────
  const handleDelete = async (reviewId) => {
    try {
      await fetch(`${API}/reviews/${reviewId}?user_id=${userId}`, { method: "DELETE" })
      loadReviews()
    } catch {}
  }

  const [showAuth, setShowAuth] = useState(false)



  return (
    <>
      <style>{`
        .reviews-section { font-family: 'DM Sans', sans-serif; }

        .reviews-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .reviews-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .reviews-summary {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .reviews-average {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1;
        }

        .reviews-total {
          font-size: 12px;
          color: #9ca3a0;
          margin-top: 2px;
        }

        .review-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 16px 20px;
        }

        .review-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .review-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .review-user-name {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }

        .review-date {
          font-size: 11px;
          color: #9ca3a0;
          margin-top: 1px;
        }

        .review-comment {
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
          margin-top: 8px;
        }

        .review-delete {
          font-size: 11px;
          color: #9ca3a0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .review-delete:hover { color: #dc2626; }

        .write-review-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.8);
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          color: #374151;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .write-review-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }

        .review-form {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 20px;
        }

        .review-textarea {
          width: 100%;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          background: rgba(255,255,255,0.8);
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          margin-top: 14px;
          box-sizing: border-box;
        }
        .review-textarea:focus { border-color: #6ee7b7; }
        .review-textarea::placeholder { color: #9ca3a0; }

        .review-submit-btn {
          padding: 9px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          color: #4a443b;
          border: 1px solid #b4aa96;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .review-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }
        .review-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .review-cancel-btn {
          padding: 9px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 400;
          font-family: 'DM Sans', sans-serif;
          background: none;
          color: #9ca3a0;
          border: 1px solid rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.2s;
        }
        .review-cancel-btn:hover { color: #374151; background: rgba(0,0,0,0.03); }

        .empty-reviews {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3a0;
          font-size: 14px;
        }
      `}</style>

      <div className="reviews-section glass-card rounded-2xl p-6 shadow-sm">

        {/* Header */}
        <div className="reviews-header">
          <div>
            <p className="reviews-title">Reviews</p>
            {summary?.total > 0 && (
              <div className="reviews-summary" style={{ marginTop: 6 }}>
                <span className="reviews-average">{summary.average}</span>
                <div>
                  <StarDisplay rating={Math.round(summary.average)} />
                  <p className="reviews-total">{summary.total} review{summary.total !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>

          {!showForm && (
            <button className="write-review-btn" onClick={() => {
                if (!userId) {
                    setShowAuth(true)
                    return
                    }
                setShowForm(true)
            }}>
                ✏️ Escribir review
            </button>
            )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="review-form" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 10 }}>
              Tu rating
            </p>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              className="review-textarea"
              rows={3}
              placeholder="Contá tu experiencia (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="review-cancel-btn" onClick={() => { setShowForm(false); setRating(0); setComment("") }}>
                Cancelar
              </button>
              <button
                className="review-submit-btn"
                onClick={handleSubmit}
                disabled={!rating || submitting}
              >
                {submitting ? "Enviando..." : "Publicar review"}
              </button>
            </div>
          </div>
        )}

        {/* Lista de reviews */}
        {loading ? (
          <div className="empty-reviews">Cargando...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-reviews">
            <p style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>💬</p>
            Todavía no hay reviews. ¡Sé el primero!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-card-header">
                  <div className="review-user">
                    <Avatar user={review.user} />
                    <div>
                      <p className="review-user-name">{review.user?.name || "Usuario"}</p>
                      <p className="review-date">{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StarDisplay rating={review.rating} size={14} />
                    {review.user?.id === userId && (
                      <button className="review-delete" onClick={() => handleDelete(review.id)}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
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