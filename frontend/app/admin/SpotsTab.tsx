"use client"

import Pill from "@/components/ui/Pill"
import { pill, input } from "@/lib/theme"
import type { AdminSpot, SortBy } from "./types"

interface Props {
  displayed: AdminSpot[]
  pending: number
  filter: "pending" | "approved" | "all"
  setFilter: (f: "pending" | "approved" | "all") => void
  searchSpots: string
  setSearchSpots: (v: string) => void
  sortBy: SortBy
  setSortBy: (v: SortBy) => void
  loadError: string | null
  loading: boolean
  actionLoading: number | null
  onApprove: (id: number, approved: boolean) => Promise<void>
  onEdit: (spot: { id: number; name: string; description: string }) => void
  onDeleteRequest: (id: number) => void
}

export default function SpotsTab({
  displayed, pending, filter, setFilter, searchSpots, setSearchSpots,
  sortBy, setSortBy, loadError, loading, actionLoading, onApprove, onEdit, onDeleteRequest,
}: Props) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["pending", "approved", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={pill(filter === f)}>
            {f === "pending" ? `Pendientes (${pending})` : f === "approved" ? "Aprobados" : "Todos"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por nombre, categoría, departamento..."
          value={searchSpots}
          onChange={e => setSearchSpots(e.target.value)}
          style={{ ...input, flex: 1, minWidth: 200, width: "auto" }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          style={{ ...input, width: "auto" }}
        >
          <option value="date_desc">Más recientes primero</option>
          <option value="date_asc">Más antiguos primero</option>
          <option value="name">Ordenar por nombre</option>
          <option value="category">Ordenar por categoría</option>
          <option value="department">Ordenar por departamento</option>
        </select>
      </div>

      {filter === "pending" && displayed.length > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button
            onClick={async () => {
              for (const s of displayed) {
                await onApprove(s.id, true)
              }
            }}
            style={{ padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none" }}
          >
            Aprobar todos ({displayed.length})
          </button>
        </div>
      )}

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : displayed.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay spots en esta categoría.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map(spot => {
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
                    <Pill variant={spot.is_approved ? "green" : "yellow"} size="sm">
                      {spot.is_approved ? "Aprobado" : "Pendiente"}
                    </Pill>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>
                    {spot.category?.name} · {spot.department}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      📷 {spot.images?.length ?? 0} foto{spot.images?.length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      ⭐ {spot.review_count ?? 0} reseña{spot.review_count !== 1 ? "s" : ""}
                    </span>
                    {spot.owner_email && (
                      <a href={`mailto:${spot.owner_email}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>
                        ✉️ {spot.owner_email}
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {!spot.is_approved ? (
                    <button onClick={() => onApprove(spot.id, true)} disabled={actionLoading === spot.id}
                      className="action-btn-sm" style={{ background: "var(--primary)", color: "#fff", border: "none", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                      Aprobar
                    </button>
                  ) : (
                    <button onClick={() => onApprove(spot.id, false)} disabled={actionLoading === spot.id}
                      className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                      Desaprobar
                    </button>
                  )}
                  <a href={`/spots/${spot.slug ?? spot.id}`} target="_blank" rel="noopener noreferrer"
                    className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    Ver
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://rumboapp.uy/spots/${spot.slug ?? spot.id}`)}
                    className="action-btn-sm"
                    style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)" }}
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => onEdit({ id: spot.id, name: spot.name, description: spot.description ?? "" })}
                    className="action-btn-sm"
                    style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)" }}
                  >
                    ✏️
                  </button>
                  <button onClick={() => onDeleteRequest(spot.id)} disabled={actionLoading === spot.id}
                    className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
