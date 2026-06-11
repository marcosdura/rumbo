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
  images: { cloudinary_public_id: string; is_main: boolean }[]
}

export default function AdminSpotsPage() {
  const { data: session } = useSession()
  const token = session?.id_token
  const [spots, setSpots] = useState<AdminSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending")
  const [actionLoading, setActionLoading] = useState<number | null>(null)

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

  const filtered = spots.filter(s =>
    filter === "all" ? true
    : filter === "pending" ? !s.is_approved
    : s.is_approved
  )

  const pending = spots.filter(s => !s.is_approved).length

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <a href="/" style={{ fontSize: 13, color: "#7a7669", textDecoration: "none" }}>← Volver a Rumbo</a>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1b1b19", margin: "12px 0 4px" }}>Gestión de spots</h1>
          {pending > 0 && (
            <p style={{ fontSize: 14, color: "#c0392b", margin: 0 }}>
              {pending} spot{pending !== 1 ? "s" : ""} pendiente{pending !== 1 ? "s" : ""} de aprobación
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["pending", "approved", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(spot => {
              const mainImage = spot.images?.find(i => i.is_main) || spot.images?.[0]
              return (
                <div key={spot.id} style={{
                  background: "#fff", border: "1px solid #e0ddd6", borderRadius: 16,
                  padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{ width: 72, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f0ede8" }}>
                    {mainImage ? (
                      <img
                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_144,h_112,c_fill/${mainImage.cloudinary_public_id}`}
                        alt={spot.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏔️</div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{spot.name}</p>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: spot.is_approved ? "#e8f5ee" : "#fef3cd",
                        color: spot.is_approved ? "#1b4332" : "#92400e",
                      }}>
                        {spot.is_approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#7a7669", margin: 0 }}>
                      {spot.category?.name} · {spot.department}
                      {spot.owner_email && ` · ${spot.owner_email}`}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!spot.is_approved ? (
                      <button
                        onClick={() => handleApprove(spot.id, true)}
                        disabled={actionLoading === spot.id}
                        style={{
                          padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit", border: "none",
                          background: "#2d6a4f", color: "#fff",
                          opacity: actionLoading === spot.id ? 0.6 : 1,
                        }}
                      >
                        Aprobar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(spot.id, false)}
                        disabled={actionLoading === spot.id}
                        style={{
                          padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                          border: "1px solid #e0ddd6", background: "#fff", color: "#3d3d3a",
                          opacity: actionLoading === spot.id ? 0.6 : 1,
                        }}
                      >
                        Desaprobar
                      </button>
                    )}
                    <a
                      href={`/spots/${spot.id}`}
                      target="_blank"
                      style={{
                        padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: "1px solid #e0ddd6", background: "#fff", color: "#3d3d3a",
                        textDecoration: "none", display: "inline-flex", alignItems: "center",
                      }}
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => handleDelete(spot.id)}
                      disabled={actionLoading === spot.id}
                      style={{
                        padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                        border: "1px solid #fecaca", background: "#fff", color: "#dc2626",
                        opacity: actionLoading === spot.id ? 0.6 : 1,
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
