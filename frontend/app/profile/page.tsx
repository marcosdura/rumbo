"use client"

import { useSession, signOut } from "next-auth/react"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { useState, useEffect } from "react"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { CldImage } from "next-cloudinary"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])

 useEffect(() => {
  if (!session?.id_token) return

  const headers = { Authorization: `Bearer ${session.id_token}` }

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, { headers })
    .then(res => res.json())
    .then(data => setFavorites(Array.isArray(data) ? data : []))

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/user/me`, { headers })
    .then(res => res.json())
    .then(data => setReviews(Array.isArray(data) ? data : []))
}, [session?.id_token, session?.error])

  if (status === "loading") return <LoadingScreen />

  if (!session) return null

  const { user } = session
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  const joinDate = new Date().toLocaleDateString("es-UY", { month: "long", year: "numeric" })

  const s = {
    card: {
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    },
    infoIcon: {
      width: 36, height: 36, borderRadius: 10,
      background: "#f7f5f0", border: "1px solid #e0ddd6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, flexShrink: 0,
    },
    infoLabel: {
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "#2d6a4f", marginBottom: 2,
    },
    infoValue: {
      fontSize: 14, color: "#1b1b19", fontWeight: 400,
    },
    statNumber: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 28, fontWeight: 600, color: "#1b1b19",
      lineHeight: 1, marginBottom: 4,
    },
    statLabel: {
      fontSize: 11, color: "#9a9690", fontWeight: 600,
      letterSpacing: "0.08em", textTransform: "uppercase",
    },
    actionBtn: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "11px 14px", borderRadius: 12,
      fontSize: 14, fontWeight: 400,
      fontFamily: "'DM Sans', sans-serif",
      cursor: "pointer",
      border: "1px solid #e0ddd6",
      background: "#fff",
      color: "#3d3d3a",
      width: "100%", textAlign: "left" as const,
      textDecoration: "none",
    },
    actionBtnIcon: {
      width: 32, height: 32, borderRadius: 8,
      background: "#f7f5f0", border: "1px solid #e0ddd6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, flexShrink: 0,
    },
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fade-up   { opacity: 0; transform: translateY(18px); animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        .fade-up-4 { animation-delay: 0.35s; }
        .fade-up-5 { animation-delay: 0.45s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .action-link:hover { background: #f7f5f0 !important; }
        .action-btn-danger:hover { background: #fdf0f0 !important; }
        .fav-thumb:hover { transform: scale(1.03); }
        .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09) !important; transform: translateY(-2px); }

        .profile-scroll {
          flex: 1; overflow-y: auto; margin-top: 40px; padding-bottom: 40px;
        }
        .profile-wrapper {
          max-width: 1000px; width: 100%; margin: 0 auto; padding: 0 24px;
        }
        .profile-grid {
          display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start;
        }
        .profile-favs-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }

        @media (max-width: 768px) {
          .profile-scroll  { margin-top: 24px; }
          .profile-wrapper { padding: 0 16px; }
          .profile-grid    { grid-template-columns: 1fr; }
          .profile-favs-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <Navbar />

      <div className="profile-scroll" style={{ display: "flex", flexDirection: "column" }}>
        <div className="profile-wrapper">
        {/* Header */}
         <div className="fade-up fade-up-1" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
              Tu cuenta
            </p>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
            Perfil
          </h1>
        </div>
            
        <div className="profile-grid">
          
          {/* ── Columna izquierda ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Card principal */}
            <div className="fade-up fade-up-2" style={{ ...s.card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #b7dfc8", padding: 3, flexShrink: 0 }}>
                  {user?.image ? (
                    <img src={user.image} alt={user?.name ?? ""} referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #52b788, #1b4332)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: "#fff" }}>
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#1b1b19", margin: "0 0 3px" }}>
                    {user?.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#9a9690", margin: 0 }}>
                    Miembro desde {joinDate}
                  </p>
                </div>
              </div>

              <div>
                {[
                  { icon: "✉️", label: "Email", value: user?.email },
                  { icon: "🔗", label: "Cuenta conectada", value: "Google" },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #ede9e1" : "none" }}>
                    <div style={s.infoIcon}>{row.icon}</div>
                    <div>
                      <p style={s.infoLabel}>{row.label}</p>
                      <p style={{ ...s.infoValue, fontSize: 13 }}>{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="fade-up fade-up-3" style={{ ...s.card, padding: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  className="action-btn-danger"
                  style={{ ...s.actionBtn, color: "#dc2626", border: "1px solid #f5c0c0", background: "#fdf0f0" }}
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <div style={{ ...s.actionBtnIcon, background: "#fdf0f0", border: "1px solid #f5c0c0" }}>↩</div>
                  Cerrar sesión
                </button>
              </div>
            </div>

          </div>

          {/* ── Columna derecha ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stats */}
            <div className="fade-up fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { number: reviews.length.toString(), label: "Reviews", emoji: "💬", href: "/reviews" },
                { number: favorites.length.toString(), label: "Favoritos", emoji: "❤️", href: "/favorites" },
              ].map(stat => (
                <Link key={stat.label} href={stat.href} style={{ textDecoration: "none" }}>
                  <div className="stat-card" style={{ ...s.card, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "box-shadow 0.2s, transform 0.2s", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f7f5f0", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        {stat.emoji}
                      </div>
                      <div>
                        <p style={s.statNumber}>{stat.number}</p>
                        <p style={s.statLabel}>{stat.label}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: "#b0aca5" }}>→</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Preview favoritos */}
            {favorites.length > 0 && (
              <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f" }} />
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                      Últimos favoritos
                    </p>
                  </div>
                  {favorites.length > 3 && (
                    <Link href="/favorites" style={{ fontSize: 12, color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}>
                      Ver todos ({favorites.length}) →
                    </Link>
                  )}
                </div>
                <div className="profile-favs-grid">
                  {favorites.slice(0, 3).map(spot => {
                    const main = spot.images?.find((i: any) => i.is_main) || spot.images?.[0]
                    return (
                      <Link key={spot.id} href={`/spots/${spot.slug}`} style={{ textDecoration: "none" }}>
                        <div className="fav-thumb" style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1", background: "#f7f5f0", position: "relative", transition: "transform 0.2s" }}>
                          {main ? (
                            <CldImage src={main.cloudinary_public_id} fill style={{ objectFit: "cover" }} alt={spot.name} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏕️</div>
                          )}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 8px 8px", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.2 }}>{spot.name}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      </div>
    </div>
  )
}