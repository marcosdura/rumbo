"use client"

import { useSession, signOut } from "next-auth/react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
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
                width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f",
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
      fontSize: 32, fontWeight: 600, color: "#1b1b19",
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
      width: "100%", textAlign: "left",
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
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .action-link:hover { background: #f7f5f0 !important; }
        .action-btn-danger:hover { background: #fdf0f0 !important; }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 64px" }}>

          {/* Header */}
          <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                Tu cuenta
              </p>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
              Perfil
            </h1>
          </div>

          {/* Divider */}
          <div className="fade-up fade-up-1" style={{ height: 1, background: "#e0ddd6", marginBottom: 24 }} />

          {/* Card principal */}
          <div className="fade-up fade-up-2" style={{ ...s.card, padding: "24px 28px", marginBottom: 16 }}>

            {/* Avatar + nombre */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                border: "3px solid #b7dfc8", padding: 3, flexShrink: 0,
              }}>
                {user.image ? (
                  <img
                    src={user.image} alt={user.name}
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    background: "linear-gradient(135deg, #52b788, #1b4332)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, fontWeight: 600, color: "#fff",
                  }}>
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 13, color: "#9a9690", margin: 0 }}>
                  Miembro desde {joinDate}
                </p>
              </div>
            </div>

            {/* Info rows */}
            <div>
              {[
                { icon: "✉️", label: "Email", value: user.email },
                { icon: "🔗", label: "Cuenta conectada", value: "Google" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #ede9e1" : "none",
                }}>
                  <div style={s.infoIcon}>{row.icon}</div>
                  <div>
                    <p style={s.infoLabel}>{row.label}</p>
                    <p style={s.infoValue}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="fade-up fade-up-3" style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {[
              { number: "0", label: "Reviews" },
              { number: "0", label: "Favoritos" },
            ].map(stat => (
              <div key={stat.label} style={{ ...s.card, flex: 1, padding: "18px 16px", textAlign: "center" }}>
                <p style={s.statNumber}>{stat.number}</p>
                <p style={s.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="fade-up fade-up-4" style={{ ...s.card, padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

              <Link href="/favorites" className="action-link" style={s.actionBtn}>
                <div style={s.actionBtnIcon}>❤️</div>
                <span style={{ flex: 1 }}>Mis favoritos</span>
                <span style={{ fontSize: 14, color: "#b0aca5" }}>→</span>
              </Link>

              <Link href="/reviews" className="action-link" style={s.actionBtn}>
                <div style={s.actionBtnIcon}>💬</div>
                <span style={{ flex: 1 }}>Mis reviews</span>
                <span style={{ fontSize: 14, color: "#b0aca5" }}>→</span>
              </Link>

              <div style={{ height: 1, background: "#ede9e1", margin: "4px 0" }} />

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
        <Footer />
      </div>
    </div>
  )
}