"use client"

import Pill from "@/components/ui/Pill"
import { label as labelStyle } from "@/lib/theme"
import { OPERATOR_LABELS, type OperatorKind } from "@/app/dashboard/operadores/[kind]/[id]/operator"
import { TextDiff } from "./ChangesTab"

// GET /admin/operator-change-requests
export type AdminOperatorChange = {
  id: number
  kind: OperatorKind
  operator_id: number
  requested_by: string
  created_at: string | null
  changes: { name?: { from: string; to: string }; photos?: { from: string[]; to: string[] } }
  spot: { id: number; name: string; slug: string | null }
  // Valor de hoy (para avisar si se editó mientras esperaba).
  operator: { name: string; photos: string[] }
}

interface Props {
  changes: AdminOperatorChange[]
  loadError: string | null
  loading: boolean
  actionLoading: number | null
  actionErrors: Record<number, string>
  onApprove: (id: number) => void
  onRejectRequest: (id: number) => void
}

// Pedidos de cambio de escuelas de surf y servicios de kayak: mismas filas y
// botones que los pedidos de cambio de spots (ChangesTab).
export default function OperatorChangesList({ changes, loadError, loading, actionLoading, actionErrors, onApprove, onRejectRequest }: Props) {
  return (
    <div style={{ marginTop: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", margin: "0 0 6px" }}>
        Cambios de escuelas y kayaks
      </p>
      <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, lineHeight: 1.5 }}>
        Nombre y fotos nuevas de escuelas de surf y servicios de kayak ya publicados. Al aprobar se borran las
        fotos que se reemplazaron; al rechazar, las nuevas.
      </p>

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : changes.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay cambios pendientes.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {changes.map(c => {
            const busy = actionLoading === c.id
            const photos = c.changes.photos
            return (
              <div key={c.id} className="spot-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{c.operator.name}</span>
                      <Pill variant="orange" size="sm">{OPERATOR_LABELS[c.kind]}</Pill>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>en {c.spot.name}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                      <a href={`mailto:${c.requested_by}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>✉️ {c.requested_by}</a>
                      {c.created_at && (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>Pedido el {new Date(c.created_at).toLocaleDateString("es-UY")}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button onClick={() => onApprove(c.id)} disabled={busy}
                      className="action-btn-sm" style={{ background: "var(--primary)", color: "#fff", border: "none", opacity: busy ? 0.6 : 1 }}>
                      {busy ? "Procesando..." : "Aprobar"}
                    </button>
                    <button onClick={() => onRejectRequest(c.id)} disabled={busy}
                      className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: busy ? 0.6 : 1 }}>
                      Rechazar
                    </button>
                  </div>
                </div>

                {actionErrors[c.id] && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{actionErrors[c.id]}</p>}

                <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  {c.changes.name && (
                    <TextDiff title="Nombre" from={c.changes.name.from} to={c.changes.name.to} current={c.operator.name} />
                  )}
                  {photos && (
                    <div>
                      <span style={labelStyle}>Fotos: así quedarían ({photos.to.length})</span>
                      <div className="photo-grid" style={{ marginTop: 6 }}>
                        {photos.to.map(url => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="photo-card" style={{ display: "block" }}>
                            <img src={url} alt="" />
                            {!photos.from.includes(url) && (
                              <div style={{ position: "absolute", top: 6, left: 6, background: "#fef9e7", color: "#78590a", border: "1px solid #f0d98a", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 6 }}>
                                Nueva
                              </div>
                            )}
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
