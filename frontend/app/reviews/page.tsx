"use client"

import { useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import Navbar from "@/components/layout/Navbar"
import LoadingScreen from "@/components/ui/LoadingScreen"
import Footer from "@/components/layout/Footer"
import { StarDisplay } from "@/components/ui/StarRating"
import Link from "next/link"
import Pill from "@/components/ui/Pill"

const API = "http://localhost:8000"

function timeAgo(dateStr) {
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
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const token = session?.id_token

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API}/reviews/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setReviews(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (status === "loading") return
    if ((session as any)?.error === "RefreshTokenError") {
      signIn("google", {}, { prompt: "select_account" })
      return
    }
    if (token) loadReviews()
    else setLoading(false)
  }, [token, status, (session as any)?.error])

  const handleDelete = async (reviewId) => {
    try {
      await fetch(`${API}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch {}
  }

  if (status === "loading" || loading) return <LoadingScreen />

  // si no esta logueado
  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            background: "#fff", border: "1px solid #e0ddd6",
            borderRadius: 20, padding: "60px 48px",
            textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            maxWidth: 400,
          }}>
            <p style={{ fontSize: 40, marginBottom: 16, opacity: 0.25 }}>💬</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 8 }}>
              Iniciá sesión
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9a9690", lineHeight: 1.6 }}>
              Iniciá sesión para ver tus reviews
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fade-up   { opacity: 0; transform: translateY(18px); animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .review-card {
          background: #fff;
          border: 1px solid #e0ddd6;
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
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: #1b1b19;
          text-decoration: none;
          transition: color 0.15s;
        }
        .review-spot-link:hover { color: #2d6a4f; }

        .delete-btn {
          font-size: 12px;
          color: #9a9690;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .delete-btn:hover { color: #dc2626; }

        .explore-btn:hover {
          background: #2d6a4f !important;
          transform: translateY(-1px);
        }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "40px 24px 64px", minHeight: "calc(100vh - 200px)" }}>

          {/* Header */}
          <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                Tu actividad
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
                Mis reviews
              </h1>
              {reviews.length > 0 && (
                <Pill variant="dark-green" style={{ fontSize: 12, padding: "3px 12px", flexShrink: 0 }}>
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </Pill>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="fade-up fade-up-1" style={{ height: 1, background: "#e0ddd6", marginBottom: 28 }} />

          {/* Estado vacío */}
          {reviews.length === 0 && (
            <div className="fade-up fade-up-2" style={{
              background: "#fff", border: "1px solid #e0ddd6",
              borderRadius: 20, padding: "64px 40px",
              textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <p style={{ fontSize: 44, marginBottom: 16, opacity: 0.25 }}>💬</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 8 }}>
                Todavía no escribiste reviews
              </p>
              <p style={{ fontSize: 14, color: "#9a9690", marginBottom: 24, lineHeight: 1.6 }}>
                Visitá un spot y contá tu experiencia
              </p>
              <Link href="/search" className="explore-btn" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 22px", borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                background: "#1b4332", color: "#fff",
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

                    <div>
                      <Link href={`/spots/${review.spot_id}`} className="review-spot-link">
                        {review.spot_name || `Spot #${review.spot_id}`}
                      </Link>
                      <p style={{ fontSize: 11, color: "#9a9690", marginTop: 3 }}>
                        {timeAgo(review.created_at)}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <StarDisplay rating={review.rating} size={14} />
                      <button className="delete-btn" onClick={() => handleDelete(review.id)}>
                        Eliminar
                      </button>
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
        <Footer />
      </div>
    </div>
  )
}