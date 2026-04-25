"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SpotCard from "@/components/SpotCard"
import { useFavoritesStore } from "@/store/favoritesStore"
import Link from "next/link"

export default function FavoritosPage() {
  const { data: session, status } = useSession()
  const { favorites, loading, loadFavorites } = useFavoritesStore()

  useEffect(() => {
    if (session?.user?.id) loadFavorites(session.user.id)
  }, [session?.user?.id])

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
            Iniciá sesión para ver tus favoritos
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9ca3a0" }}>
            Guardá los spots que más te gustan
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .fav-page  { font-family: 'DM Sans', sans-serif; }
        .fav-title { font-family: 'Playfair Display', serif; }

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

      <div className="flex flex-1 fav-page">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8" style={{ minHeight: "calc(100vh - 200px)" }}>

            {/* Header */}
            <div className="mb-2 fade-up fade-up-1">
              <p className="section-label">Tu colección</p>
              <h2 className="fav-title text-4xl font-semibold text-gray-900 mt-1">
                Favoritos
                {favorites.length > 0 && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 400, color: "#9ca3a0", marginLeft: 12 }}>
                    {favorites.length} spot{favorites.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
            </div>

            <div className="divider fade-up fade-up-1" />

            {/* Estado vacío */}
            {favorites.length === 0 && (
              <div className="empty-state fade-up fade-up-2">
                <p style={{ fontSize: 44, marginBottom: 16, opacity: 0.35 }}>🤍</p>
                <p className="fav-title" style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>
                  Todavía no tenés favoritos
                </p>
                <p style={{ fontSize: 14, color: "#9ca3a0" }}>
                  Explorá los spots y guardá los que más te gustan
                </p>
                <Link href="/spots" className="explore-btn">
                  Explorar spots →
                </Link>
              </div>
            )}

            {/* Grid */}
            {favorites.length > 0 && (
              <div
                className="fade-up fade-up-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 20,
                }}
              >
                {favorites.map((spot, index) => (
                  <SpotCard key={spot.id} spot={spot} index={index} />
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