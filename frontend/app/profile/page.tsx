"use client"

import { useSession, signOut } from "next-auth/react"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/layout/Navbar"
import Link from "next/link"
import { CldImage } from "next-cloudinary"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [mySpots, setMySpots] = useState<any[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const confirmInputRef = useRef<HTMLInputElement>(null)

 useEffect(() => {
  if (!session?.id_token) return

  const headers = { Authorization: `Bearer ${session.id_token}` }

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, { headers })
    .then(res => res.json())
    .then(data => setFavorites(Array.isArray(data) ? data : []))

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/user/me`, { headers })
    .then(res => res.json())
    .then(data => setReviews(Array.isArray(data) ? data : []))

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/mine`, { headers })
    .then(res => res.json())
    .then(data => setMySpots(Array.isArray(data) ? data : []))
}, [session?.id_token, session?.error])

  if (status === "loading") return <LoadingScreen />

  if (!session) return null

  const { user } = session
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  const joinDate = new Date().toLocaleDateString("es-UY", { month: "long", year: "numeric" })

  async function handleDeleteAccount() {
    if (confirmText !== "CONFIRMAR") return
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.id_token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setDeleteError(body.detail ?? "Error al eliminar la cuenta. Intentá de nuevo.")
        setDeleting(false)
        return
      }
      await signOut({ callbackUrl: "/?cuenta=eliminada" })
    } catch {
      setDeleteError("Error de red. Intentá de nuevo.")
      setDeleting(false)
    }
  }

  function openDeleteModal() {
    setConfirmText("")
    setDeleteError("")
    setShowDeleteModal(true)
    setTimeout(() => confirmInputRef.current?.focus(), 50)
  }

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

        .delete-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .delete-modal {
          background: #f5f4f0; border: 1px solid #e0ddd6; border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
          padding: 28px; width: 100%; max-width: 440px;
          font-family: 'DM Sans', sans-serif;
        }
        .delete-confirm-input {
          width: 100%; box-sizing: border-box;
          padding: 10px 14px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          outline: none; background: #fff;
          transition: border-color 0.15s;
        }
        .delete-confirm-input:focus { border-color: #dc2626; }
        .delete-btn-confirm {
          padding: 11px 20px; border-radius: 12px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.15s, opacity 0.15s;
        }
        .delete-btn-confirm:disabled { cursor: not-allowed; }
        .delete-btn-cancel {
          padding: 11px 20px; border-radius: 12px;
          border: 1px solid #e0ddd6; background: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; color: #3d3d3a;
          transition: background 0.15s;
        }
        .delete-btn-cancel:hover { background: #f7f5f0; }

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

                {/* Zona peligrosa — desplegable */}
                <div style={{ borderTop: "1px solid #ede9e1", marginTop: 4, paddingTop: 6 }}>
                  <button
                    style={{ ...s.actionBtn, color: "#9a9690", background: "transparent", border: "none", padding: "8px 6px", fontSize: 12, gap: 6 }}
                    onClick={() => setShowDangerZone(v => !v)}
                  >
                    <span style={{ fontSize: 10, transition: "transform 0.2s", display: "inline-block", transform: showDangerZone ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    Zona peligrosa
                  </button>

                  {showDangerZone && (
                    <button
                      className="action-btn-danger"
                      style={{ ...s.actionBtn, color: "#9a1c1c", border: "1px solid #f5c0c0", background: "#fdf0f0", marginTop: 4 }}
                      onClick={openDeleteModal}
                    >
                      <div style={{ ...s.actionBtnIcon, background: "#fdf0f0", border: "1px solid #f5c0c0", fontSize: 13 }}>🗑</div>
                      Eliminar cuenta
                    </button>
                  )}
                </div>
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

            {mySpots.length > 0 && (
              <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f" }} />
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                    Tus lugares
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {mySpots.map(spot => {
                    const main = spot.images?.find((i: any) => i.is_main) || spot.images?.[0]
                    return (
                      <div key={spot.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f7f5f0" }}>
                          {main ? (
                            <img
                              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_96,h_96,c_fill/${main.cloudinary_public_id}`}
                              alt={spot.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏕️</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {spot.name}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                              background: spot.is_approved ? "#e8f5ee" : "#fef3cd",
                              color: spot.is_approved ? "#1b4332" : "#92400e",
                            }}>
                              {spot.is_approved ? "Aprobado" : "Pendiente"}
                            </span>
                            <span style={{ fontSize: 12, color: "#9a9690" }}>
                              ⭐ {spot.review_count ?? 0} reseña{spot.review_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/spots/${spot.id}`}
                          style={{
                            padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                            background: "#f7f5f0", border: "1px solid #e0ddd6", color: "#3d3d3a",
                            textDecoration: "none", flexShrink: 0,
                          }}
                        >
                          Administrar →
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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

      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: "0 0 12px" }}>
              ¿Eliminar tu cuenta?
            </h2>

            <p style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6, margin: "0 0 16px" }}>
              Esta acción es permanente y no se puede deshacer. Al eliminar tu cuenta:
            </p>

            <ul style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.8, margin: "0 0 20px", paddingLeft: 20 }}>
              <li>Tu perfil y datos personales serán eliminados</li>
              <li>Todas tus reviews en spots, escuelas de surf y servicios de kayak serán eliminadas</li>
              <li>No podrás recuperar esta información</li>
            </ul>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4a4a46", marginBottom: 6 }}>
              Para confirmar, escribí <span style={{ fontWeight: 700, color: "#dc2626" }}>CONFIRMAR</span> en el campo de abajo
            </label>
            <input
              ref={confirmInputRef}
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="CONFIRMAR"
              className="delete-confirm-input"
              style={{
                border: confirmText.length > 0 && confirmText !== "CONFIRMAR"
                  ? "1px solid #dc2626"
                  : "1px solid #e0ddd6",
              }}
            />

            {deleteError && (
              <p style={{ fontSize: 13, color: "#dc2626", margin: "8px 0 0" }}>{deleteError}</p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="delete-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button
                className="delete-btn-confirm"
                disabled={confirmText !== "CONFIRMAR" || deleting}
                onClick={handleDeleteAccount}
                style={{
                  background: confirmText === "CONFIRMAR" ? "#dc2626" : "#d1cdc7",
                  color: confirmText === "CONFIRMAR" ? "#fff" : "#9a9690",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Eliminando..." : "Eliminar cuenta definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}