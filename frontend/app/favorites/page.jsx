"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import SpotCard from "@/components/spots/SpotCard"
import { useFavoritesStore } from "@/store/favoritesStore"
import Link from "next/link"
import Pill from "@/components/ui/Pill"

export default function FavoritosPage() {
  const { data: session, status } = useSession()
  const { favorites, loading, loadFavorites } = useFavoritesStore()

  useEffect(() => {
    if (session?.id_token) loadFavorites(session.id_token)
  }, [session?.id_token])

  // cargando
  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); opacity: 0.35; }
              50%       { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "var(--primary)",
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // si no esta logueado
  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "60px 48px",
            textAlign: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            maxWidth: 400,
          }}>
            <p style={{ fontSize: 40, marginBottom: 16, opacity: 0.25 }}>🔒</p>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 8,
            }}>
              Iniciá sesión
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: "var(--muted)", lineHeight: 1.6,
            }}>
              Guardá los spots que más te gustan y accedé a tu colección desde cualquier lugar
            </p>
          </div>
        </div>
      </div>
    )
  }

  // si esta logueado
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .favs-wrapper { max-width: 1152px; margin: 0 auto; padding: 40px 24px 64px; min-height: calc(100vh - 200px); }
        .favs-title   { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 600; color: #1b1b19; margin: 0; line-height: 1.2; }
        .favs-grid    { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }

        @media (max-width: 768px) {
          .favs-wrapper { padding: 24px 16px 48px; }
          .favs-title   { font-size: 26px; }
          .favs-grid    { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .favs-grid .spot-card-img-wrap { height: 110px !important; }
          .favs-grid .spot-card-body     { padding: 7px 9px 9px !important; }
          .favs-grid .spot-card-name     { font-size: 12px !important; margin-bottom: 4px !important; }
          .favs-grid .spot-card-badges   { gap: 4px !important; }
        }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="favs-wrapper">

          {/* Header */}
          <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                Tu colección
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <h1 className="favs-title">Favoritos</h1>
              {favorites.length > 0 && (
                <Pill variant="dark-green" hover style={{ fontSize: 12, padding: "3px 12px", flexShrink: 0 }}>
                  {favorites.length} spot{favorites.length !== 1 ? "s" : ""}
                </Pill>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="fade-up fade-up-1" style={{ height: 1, background: "var(--border)", marginBottom: 28 }} />

          {/* Estado vacío */}
          {favorites.length === 0 && (
            <div className="fade-up fade-up-2" style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "64px 40px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <p style={{ fontSize: 44, marginBottom: 16, opacity: 0.25 }}>❤️</p>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 8,
              }}>
                Todavía no tenés favoritos
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
                Explorá los spots y guardá los que más te gustan
              </p>
              <Link href="/search" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 22px", borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                background: "var(--primary-dark)", color: "#fff",
                textDecoration: "none",
                transition: "background 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--primary-dark)"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                Explorar spots →
              </Link>
            </div>
          )}

          {/* Grid */}
          {favorites.length > 0 && (
            <div className="fade-up fade-up-2 favs-grid">
              {favorites.map((spot, index) => (
                <SpotCard key={spot.id} spot={spot} index={index} />
              ))}
            </div>
          )}

        </div>
        <Footer />
      </div>
    </div>
  )
}