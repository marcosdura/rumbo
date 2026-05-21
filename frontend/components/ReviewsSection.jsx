"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StarDisplay, StarPicker } from "@/components/StarRating"
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

  const s = {
    wrap: {
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    },
    sectionLabel: {
      display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
    },
    dot: {
      width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0,
    },
    label: {
      fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "#2d6a4f", margin: 0,
    },
    title: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: 0,
    },
    average: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 36, fontWeight: 600, color: "#1b1b19", lineHeight: 1,
    },
    totalText: {
      fontSize: 12, color: "#9a9690", marginTop: 2,
    },
    writeBtn: {
      display: "flex", alignItems: "center", gap: 6,
      padding: "9px 18px", borderRadius: 12,
      border: "1px solid #e0ddd6", background: "#fff",
      fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
      cursor: "pointer", color: "#1b4332",
      transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    formWrap: {
      background: "#f7f5f0",
      border: "1px solid #e0ddd6",
      borderRadius: 16, padding: 20, marginBottom: 20,
    },
    ratingLabel: {
      fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "#2d6a4f", marginBottom: 10,
    },
    textarea: {
      width: "100%", border: "1px solid #e0ddd6", borderRadius: 12,
      padding: "12px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
      color: "#1b1b19", background: "#fff", resize: "none", outline: "none",
      transition: "border-color 0.2s", marginTop: 14, boxSizing: "border-box",
    },
    submitBtn: {
      padding: "9px 20px", borderRadius: 12, fontSize: 14,
      fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
      background: "#1b4332", color: "#fff",
      border: "none", cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    cancelBtn: {
      padding: "9px 16px", borderRadius: 12, fontSize: 14,
      fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
      background: "none", color: "#9a9690",
      border: "1px solid #e0ddd6", cursor: "pointer",
    },
    reviewCard: {
      background: "#fff", border: "1px solid #e0ddd6",
      borderRadius: 16, padding: "16px 20px",
    },
    userName: { fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 },
    dateText: { fontSize: 11, color: "#9a9690", marginTop: 2 },
    commentText: { fontSize: 14, color: "#3d3d3a", lineHeight: 1.65, marginTop: 10 },
    deleteBtn: {
      fontSize: 11, color: "#9a9690", background: "none",
      border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      transition: "color 0.15s", padding: 0,
    },
    emptyWrap: {
      textAlign: "center", padding: "48px 20px",
      color: "#9a9690", fontSize: 14,
    },
  }

  return (
    <>
      <div style={s.wrap}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={s.sectionLabel}>
              <div style={s.dot} />
              <span style={s.label}>Reseñas</span>
            </div>
            <p style={s.title}>Reviews</p>
            {summary?.total > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={s.average}>{summary.average}</span>
                <div>
                  <StarDisplay rating={Math.round(summary.average)} />
                  <p style={s.totalText}>{summary.total} review{summary.total !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>

          {!showForm && (
            <button
              style={s.writeBtn}
              onClick={() => { if (!token) { setShowAuth(true); return } setShowForm(true) }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0f7f3"; e.currentTarget.style.transform = "translateY(-1px)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(0)" }}
            >
              ✏️ Escribir review
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div style={s.formWrap}>
            <p style={s.ratingLabel}>Tu rating</p>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              style={s.textarea}
              rows={3}
              placeholder="Contá tu experiencia (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={e => e.target.style.borderColor = "#2d6a4f"}
              onBlur={e => e.target.style.borderColor = "#e0ddd6"}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button
                style={s.cancelBtn}
                onClick={() => { setShowForm(false); setRating(0); setComment("") }}
                onMouseEnter={e => { e.currentTarget.style.color = "#3d3d3a"; e.currentTarget.style.background = "#f0ede8" }}
                onMouseLeave={e => { e.currentTarget.style.color = "#9a9690"; e.currentTarget.style.background = "none" }}
              >
                Cancelar
              </button>
              <button
                style={{ ...s.submitBtn, opacity: !rating || submitting ? 0.45 : 1, cursor: !rating || submitting ? "not-allowed" : "pointer" }}
                onClick={handleSubmit}
                disabled={!rating || submitting}
                onMouseEnter={e => { if (rating && !submitting) { e.currentTarget.style.background = "#2d6a4f"; e.currentTarget.style.transform = "translateY(-1px)" } }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1b4332"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                {submitting ? "Enviando..." : "Publicar review"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={s.emptyWrap}>Cargando...</div>
        ) : reviews.length === 0 ? (
          <div style={s.emptyWrap}>
            <p style={{ fontSize: 28, marginBottom: 10, opacity: 0.25 }}>💬</p>
            Todavía no hay reviews. ¡Sé el primero!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((review) => (
              <div key={review.id} style={s.reviewCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar user={review.user} />
                    <div>
                      <p style={s.userName}>{review.user?.name || "Usuario"}</p>
                      <p style={s.dateText}>{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StarDisplay rating={review.rating} size={14} />
                    {review.user?.id === userId && (
                      <button
                        style={s.deleteBtn}
                        onClick={() => handleDelete(review.id)}
                        onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
                        onMouseLeave={e => e.currentTarget.style.color = "#9a9690"}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p style={s.commentText}>{review.comment}</p>
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