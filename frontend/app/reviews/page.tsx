"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { StarDisplay } from "@/components/StarRating"
import Link from "next/link"

const API = "http://localhost:8000"

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr + "Z").getTime()  // forzá UTC
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

  const userId = session?.user?.id

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API}/reviews/user/${userId}`)
      if (res.ok) setReviews(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (userId) loadReviews()
  }, [userId])

  const handleDelete = async (reviewId) => {
    try {
      await fetch(`${API}/reviews/${reviewId}?user_id=${userId}`, { method: "DELETE" })
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch {}
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="h-screen flex flex-col bg-[#f5f4f0]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); opacity: 0.4; }
              50% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#b4aa96",
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── No logueado ───────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center flex-col gap-3">
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#1a1a1a" }}>
            Iniciá sesión para ver tus reviews
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .reviews-page  { font-family: 'DM Sans', sans-serif; }
        .reviews-title { font-family: 'Playfair Display', serif; }

        .fade-up   { opacity: 0; transform: translateY(18px); animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }

        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .section-label {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3a0;
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, rgba(0,0,0,0.06), transparent);
          margin: 0.75rem 0 1.5rem;
        }

        .review-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 18px 20px;
          transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s;
        }
        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
        }

        .review-spot-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: #1a1a1a;
          text-decoration: none;
          transition: color 0.15s;
        }
        .review-spot-name:hover { color: #4a443b; }

        .review-date {
          font-size: 11px;
          color: #9ca3a0;
          margin-top: 2px;
        }

        .review-comment {
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
          margin-top: 10px;
        }

        .delete-btn {
          font-size: 12px;
          color: #9ca3a0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .delete-btn:hover { color: #dc2626; }

        .empty-state {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
        }

        .explore-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; border-radius: 12px;
          font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          color: #4a443b; border: 1px solid #b4aa96;
          text-decoration: none; margin-top: 16px;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .explore-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
      `}</style>

      <Navbar />

      <div className="flex flex-1 reviews-page">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8" style={{ minHeight: "calc(100vh - 200px)" }}>

            {/* Header */}
            <div className="mb-2 fade-up fade-up-1">
              <p className="section-label">Tu actividad</p>
              <h2 className="reviews-title text-4xl font-semibold text-gray-900 mt-1">
                Mis reviews
                {reviews.length > 0 && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 400, color: "#9ca3a0", marginLeft: 12 }}>
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
            </div>

            <div className="divider fade-up fade-up-1" />

            {/* Estado vacío */}
            {reviews.length === 0 && (
              <div className="empty-state fade-up fade-up-2">
                <p style={{ fontSize: 44, marginBottom: 16, opacity: 0.35 }}>💬</p>
                <p className="reviews-title" style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>
                  Todavía no escribiste reviews
                </p>
                <p style={{ fontSize: 14, color: "#9ca3a0" }}>
                  Visitá un spot y contá tu experiencia
                </p>
                <Link href="/spots" className="explore-btn">
                  Explorar spots →
                </Link>
              </div>
            )}

            {/* Lista */}
            {reviews.length > 0 && (
              <div className="fade-up fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <Link href={`/spots/${review.spot_id}`} className="review-spot-name">
                          {review.spot_name || `Spot #${review.spot_id}`}
                        </Link>
                        <p className="review-date">{timeAgo(review.created_at)}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <StarDisplay rating={review.rating} size={14} />
                        <button className="delete-btn" onClick={() => handleDelete(review.id)}>
                          Eliminar
                        </button>
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
          <Footer />
        </div>
      </div>
    </div>
  )
}