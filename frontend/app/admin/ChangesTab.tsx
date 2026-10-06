"use client"

import Pill from "@/components/ui/Pill"
import { label as labelStyle } from "@/lib/theme"
import type { AdminChangeRequest } from "./types"

interface Props {
  requests: AdminChangeRequest[]
  loadError: string | null
  loading: boolean
  actionLoading: number | null
  // Error de aprobar/rechazar, por pedido (ej. el nombre ya lo tomó otro
  // spot, o ya no entran las fotos).
  actionErrors: Record<number, string>
  onApprove: (id: number) => void
  onRejectRequest: (id: number) => void
}

const cloudinaryUrl = (publicId: string, transform: string) =>
  `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transform}/${publicId}`

// Antes / después en las paletas red / green de Pill.
const beforeBox = {
  background: "#fdf0f0", border: "1px solid #f5c0c0", color: "#7c1d1d",
  borderRadius: 10, padding: "8px 12px", fontSize: 13, lineHeight: 1.5,
  whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const,
}
const afterBox = {
  ...beforeBox,
  background: "#e8f5ee", border: "1px solid #b7dfc8", color: "var(--primary-dark)",
}

function TextDiff({ title, from, to, current }: { title: string; from: string; to: string; current: string }) {
  // El "antes" se guardó al hacer el pedido; si el spot se editó después
  // (el admin, por ejemplo), aprobar pisaría ese valor nuevo.
  const stale = (current ?? "") !== (from ?? "")
  return (
    <div>
      <span style={labelStyle}>{title}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 4px", fontWeight: 600 }}>ANTES</p>
          <div style={beforeBox}>{from || "—"}</div>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 4px", fontWeight: 600 }}>DESPUÉS</p>
          <div style={afterBox}>{to}</div>
        </div>
      </div>
      {stale && (
        <p style={{ fontSize: 12, color: "#78590a", background: "#fef9e7", border: "1px solid #f0d98a", borderRadius: 10, padding: "6px 10px", margin: "8px 0 0", lineHeight: 1.5 }}>
          ⚠️ Cambió desde que se hizo el pedido. Hoy dice: «{current || "—"}». Aprobar lo reemplaza.
        </p>
      )}
    </div>
  )
}

export default function ChangesTab({ requests, loadError, loading, actionLoading, actionErrors, onApprove, onRejectRequest }: Props) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, lineHeight: 1.5 }}>
        Cambios de nombre, descripción o fotos nuevas sobre spots ya aprobados.
        Mientras esperan, el público sigue viendo la versión aprobada. Se aprueba
        o rechaza el pedido entero; al rechazar, las fotos nuevas se borran.
      </p>

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : requests.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay cambios pendientes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map(req => {
            const { spot, changes } = req
            const busy = actionLoading === req.id
            const photos = changes.photos_added ?? []
            return (
              <div key={req.id} className="spot-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 14 }}>
                {/* Cabecera, igual que las filas de Gestión de spots */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{spot.name}</span>
                      <Pill variant="orange" size="sm">Cambio pendiente</Pill>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>
                      {spot.category?.name} · {spot.department}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                      <a href={`mailto:${req.requested_by}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>
                        ✉️ {req.requested_by}
                      </a>
                      {req.created_at && (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          Pedido el {new Date(req.created_at).toLocaleDateString("es-UY")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button onClick={() => onApprove(req.id)} disabled={busy}
                      className="action-btn-sm" style={{ background: "var(--primary)", color: "#fff", border: "none", opacity: busy ? 0.6 : 1 }}>
                      {busy ? "Procesando..." : "Aprobar"}
                    </button>
                    <a href={`/spots/${spot.slug ?? spot.id}`} target="_blank" rel="noopener noreferrer"
                      className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      Ver
                    </a>
                    <button onClick={() => onRejectRequest(req.id)} disabled={busy}
                      className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: busy ? 0.6 : 1 }}>
                      Rechazar
                    </button>
                  </div>
                </div>

                {actionErrors[req.id] && (
                  <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{actionErrors[req.id]}</p>
                )}

                {/* Qué cambia */}
                <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  {changes.name && (
                    <TextDiff title="Nombre" from={changes.name.from} to={changes.name.to} current={spot.current.name} />
                  )}
                  {changes.description && (
                    <TextDiff title="Descripción" from={changes.description.from} to={changes.description.to} current={spot.current.description} />
                  )}
                  {photos.length > 0 && (
                    <div>
                      <span style={labelStyle}>
                        {photos.length} foto{photos.length !== 1 ? "s" : ""} nueva{photos.length !== 1 ? "s" : ""} · hoy tiene {spot.images.length}
                      </span>
                      <div className="photo-grid" style={{ marginTop: 6 }}>
                        {photos.map(publicId => (
                          // Click abre la foto entera: en miniatura no se ve
                          // si tiene algo que no corresponde.
                          <a key={publicId} href={cloudinaryUrl(publicId, "w_1600,c_limit")} target="_blank" rel="noopener noreferrer" className="photo-card" style={{ display: "block" }}>
                            <img src={cloudinaryUrl(publicId, "w_280,h_220,c_fill")} alt="" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
