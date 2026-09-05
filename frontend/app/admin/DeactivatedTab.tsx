"use client"

import Pill from "@/components/ui/Pill"
import type { AdminSpot } from "./types"

interface Props {
  deactivatedSpots: AdminSpot[]
  loadError: string | null
  loading: boolean
  actionLoading: number | null
  onReactivate: (id: number) => Promise<void>
  onDeleteRequest: (id: number) => void
}

export default function DeactivatedTab({ deactivatedSpots, loadError, loading, actionLoading, onReactivate, onDeleteRequest }: Props) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, lineHeight: 1.5 }}>
        Estos spots quedaron sin dueño porque la cuenta que los creó se eliminó.
        No se muestran públicamente. Contactá el email antes de reactivar o
        eliminar el spot definitivamente.
      </p>

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : deactivatedSpots.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay spots en esta situación.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {deactivatedSpots.map(spot => (
            <div key={spot.id} className="spot-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{spot.name}</span>
                  <Pill variant="yellow" size="sm">Desactivado</Pill>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>
                  {spot.category?.name} · {spot.department}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                  {spot.owner_email && (
                    <a href={`mailto:${spot.owner_email}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>
                      ✉️ {spot.owner_email} (cuenta borrada)
                    </a>
                  )}
                  {spot.owner_deleted_at && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      Desactivado el {new Date(spot.owner_deleted_at).toLocaleDateString("es-UY")}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={() => onReactivate(spot.id)} disabled={actionLoading === spot.id}
                  className="action-btn-sm" style={{ background: "var(--primary)", color: "#fff", border: "none", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                  Reactivar
                </button>
                <button onClick={() => onDeleteRequest(spot.id)} disabled={actionLoading === spot.id}
                  className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: actionLoading === spot.id ? 0.6 : 1 }}>
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
