"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type AdminSpot = {
  id: number
  name: string
  department: string
  is_approved: boolean
  owner_email: string | null
  category: { name: string } | null
  images: { cloudinary_public_id: string; is_main: boolean; order: number }[]
}

type AdminMode = "spots" | "fotos"

export default function AdminPage() {
  const { data: session } = useSession()
  const token = session?.id_token
  const [mode, setMode] = useState<AdminMode>("spots")
  const [spots, setSpots] = useState<AdminSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending")
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [photoSpotId, setPhotoSpotId] = useState<number | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => { setSpots(data); setLoading(false) })
  }, [token])

  async function handleApprove(id: number, approved: boolean) {
    setActionLoading(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${id}/approve?approved=${approved}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpots(prev => prev.map(s => s.id === id ? { ...s, is_approved: approved } : s))
    setActionLoading(null)
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este spot?")) return
    setActionLoading(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpots(prev => prev.filter(s => s.id !== id))
    setActionLoading(null)
  }

  async function handleSetMainPhoto(spotId: number, publicId: string) {
    setPhotoLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spots/${spotId}/main-image`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cloudinary_public_id: publicId }),
    })
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return {
        ...s,
        images: s.images.map(img => ({ ...img, is_main: img.cloudinary_public_id === publicId })),
      }
    }))
    setPhotoLoading(false)
  }

  async function handleDeletePhoto(spotId: number, publicId: string) {
    if (!confirm("¿Eliminar esta foto?")) return
    setPhotoLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/images/${encodeURIComponent(publicId)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId) return s
      return { ...s, images: s.images.filter(img => img.cloudinary_public_id !== publicId) }
    }))
    setPhotoLoading(false)
  }

  const pending = spots.filter(s => !s.is_approved).length
  const filtered = spots.filter(s =>
    filter === "all" ? true : filter === "pending" ? !s.is_approved : s.is_approved
  )
  const selectedSpot = spots.find(s => s.id === photoSpotId) ?? null

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .admin-nav { background: linear-gradient(160deg, #1b4332 0%, #2d6a4f 65%, #40916c 100%); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .admin-pill { padding: 7px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.12); color: #fff; }
        .admin-pill.active { background: #fff; color: #1b4332; border-color: #fff; }
        .admin-pill:not(.active):hover { background: rgba(255,255,255,0.22); }
        .spot-row { background: #fff; border: 1px solid #e0ddd6; border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
        .action-btn-sm { padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
        .photo-card { border-radius: 12px; overflow: hidden; border: 1px solid #e0ddd6; position: relative; background: #f0ede8; }
        .photo-card img { width: 100%; height: 100px; object-fit: cover; display: block; }
      `}</style>

      <nav className="admin-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/RumboLogo.png" alt="Rumbo" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>rumbo</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 8, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>modo admin</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/agregar-lugar" style={{ padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#fff", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", textDecoration: "none" }}>
            + Agregar lugar
          </a>
          <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>← Volver</a>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {([
            { id: "spots", label: `🗺️ Gestión de spots${pending > 0 ? ` (${pending})` : ""}` },
            { id: "fotos", label: "📷 Gestión de fotos" },
          ] as { id: AdminMode; label: string }[]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`admin-pill${mode === m.id ? " active" : ""}`}
              style={{ background: mode === m.id ? "#1b4332" : "#fff", color: mode === m.id ? "#fff" : "#3d3d3a", border: `1px solid ${mode === m.id ? "#1b4332" : "#e0ddd6"}` }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "spots" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["pending", "approved", "all"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${filter === f ? "#2d6a4f" : "#e0ddd6"}`,
                    background: filter === f ? "#2d6a4f" : "#fff",
                    color: filter === f ? "#fff" : "#3d3d3a",
                  }}
                >
                  {f === "pending" ? `Pendientes (${pending})` : f === "approved" ? "Aprobados" : "Todos"}
                </button>
              ))}
            </div>

            {loading ? (
              <p style={{ color: "#9a9690", fontSize: 14 }}>Cargando...</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: "#9a9690", fontSize: 14 }}>No hay spots en esta categoría.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(spot => {
                  const mainImage = spot.images?.find(i => i.is_main) || spot.images?.[0]
                  return (
                    <div key={spot.id} className="spot-row">
                      <div style={{ width: 64, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f0ede8" }}>
                        {mainImage ? (
                          <img
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_128,h_100,c_fill/${mainImage.cloudinary_public_id}`}
                            alt={spot.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏔️</div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{spot.name}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                            background: spot.is_approved ? "#e8f5ee" : "#fef3cd",
                            color: spot.is_approved ? "#1b4332" : "#92400e",
                          }}>
                            {spot.is_approved ? "Aprobado" : "Pendiente"}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#7a7669", margin: 0 }}>
                          {spot.category?.name} · {spot.department}
                          {spot.owner_email && ` · ${spot.owner_email}`}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {!spot.is_approved ? (
                          <button onClick={() => handleApprove(spot.id, true)} disabled={actionLoading === spot.id}
                            className="action-btn-sm" style={{ background: "#2d6a4f", color: "#fff", border: "none", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                            Aprobar
                          </button>
                        ) : (
                          <button onClick={() => handleApprove(spot.id, false)} disabled={actionLoading === spot.id}
                            className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid #e0ddd6", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                            Desaprobar
                          </button>
                        )}
                        <a href={`/spots/${spot.id}`} target="_blank"
                          className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid #e0ddd6", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                          Ver
                        </a>
                        <button onClick={() => handleDelete(spot.id)} disabled={actionLoading === spot.id}
                          className="action-btn-sm" style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {mode === "fotos" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <select
                style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid #e0ddd6", fontSize: 14, background: "#fff", fontFamily: "inherit", width: "100%", maxWidth: 400 }}
                value={photoSpotId ?? ""}
                onChange={e => setPhotoSpotId(Number(e.target.value) || null)}
              >
                <option value="">— Seleccioná un spot —</option>
                {spots.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category?.name})</option>
                ))}
              </select>
            </div>

            {selectedSpot && (
              <div>
                <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 12 }}>
                  {selectedSpot.images.length} foto{selectedSpot.images.length !== 1 ? "s" : ""} · La primera es la principal
                </p>
                <div className="photo-grid">
                  {[...selectedSpot.images]
                    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
                    .map(img => (
                      <div key={img.cloudinary_public_id} className="photo-card">
                        <img
                          src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_280,h_200,c_fill/${img.cloudinary_public_id}`}
                          alt=""
                        />
                        {img.is_main && (
                          <div style={{ position: "absolute", top: 6, left: 6, background: "#2d6a4f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                            Principal
                          </div>
                        )}
                        <div style={{ padding: "8px 8px 6px", display: "flex", gap: 5 }}>
                          {!img.is_main && (
                            <button
                              onClick={() => handleSetMainPhoto(selectedSpot.id, img.cloudinary_public_id)}
                              disabled={photoLoading}
                              style={{ flex: 1, padding: "4px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#e8f5ee", color: "#1b4332", border: "1px solid #b7dfc8" }}
                            >
                              Hacer principal
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePhoto(selectedSpot.id, img.cloudinary_public_id)}
                            disabled={photoLoading}
                            style={{ padding: "4px 8px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#dc2626", border: "1px solid #fecaca" }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
