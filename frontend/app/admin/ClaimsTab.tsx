"use client"

import { useState } from "react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api, ApiError } from "@/lib/api"
import { label as labelStyle, input as inputStyle } from "@/lib/theme"

// GET /admin/claims: pedidos para hacerse cargo de un lugar que sugirió un
// visitante (backend/claims.py).
export type AdminClaim = {
  id: number
  user_email: string
  message: string | null
  created_at: string | null
  spot: { id: number; name: string; slug: string | null; department: string }
}

interface Props {
  claims: AdminClaim[]
  loadError: string | null
  loading: boolean
  token: string | undefined
  // Se resolvió: el padre lo saca de la lista (aprobar también rechaza los
  // otros pedidos del mismo lugar).
  onResolved: (claim: AdminClaim, approved: boolean) => void
}

const ghostBtn = { background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)" }

export default function ClaimsTab({ claims, loadError, loading, token, onResolved }: Props) {
  const [busy, setBusy] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [rejecting, setRejecting] = useState<AdminClaim | null>(null)
  const [reason, setReason] = useState("")
  const [modalError, setModalError] = useState<string | null>(null)

  const message = (e: unknown) => (e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo resolver. Intentá de nuevo.")

  async function approve(claim: AdminClaim) {
    setBusy(claim.id)
    setErrors(prev => { const next = { ...prev }; delete next[claim.id]; return next })
    try {
      await api.post(`/admin/claims/${claim.id}/approve`, undefined, { token })
      onResolved(claim, true)
    } catch (e) {
      setErrors(prev => ({ ...prev, [claim.id]: message(e) }))
    } finally {
      setBusy(null)
    }
  }

  async function reject() {
    if (!rejecting) return
    if (!reason.trim()) { setModalError("Escribí el motivo: es lo que va a ver quien lo pidió."); return }
    setBusy(rejecting.id)
    try {
      await api.post(`/admin/claims/${rejecting.id}/reject`, { reason: reason.trim() }, { token })
      onResolved(rejecting, false)
      setRejecting(null)
    } catch (e) {
      setModalError(message(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, lineHeight: 1.5 }}>
        Personas que dicen ser el responsable o dueño de un lugar que sugirió un visitante. Si lo aprobás, el
        lugar pasa a ser suyo y deja de figurar como sugerido; a los dos casos se les avisa en la app.
      </p>

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : claims.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay pedidos para revisar.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {claims.map(c => {
            const isBusy = busy === c.id
            return (
              <div key={c.id} className="spot-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{c.spot.name}</span>
                    <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: "2px 0 0" }}>
                      {c.spot.department}
                      {c.created_at && ` · pedido el ${new Date(c.created_at).toLocaleDateString("es-UY")}`}
                    </p>
                    <a href={`mailto:${c.user_email}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>
                      ✉️ {c.user_email}
                    </a>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {c.spot.slug && (
                      <a href={`/spots/${c.spot.slug}`} target="_blank" rel="noopener noreferrer" className="action-btn-sm"
                        style={{ ...ghostBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                        Ver
                      </a>
                    )}
                    <button onClick={() => approve(c)} disabled={isBusy} className="action-btn-sm"
                      style={{ background: "var(--primary)", color: "#fff", border: "none", opacity: isBusy ? 0.6 : 1 }}>
                      {isBusy ? "Procesando..." : "Aprobar"}
                    </button>
                    <button onClick={() => { setReason(""); setModalError(null); setRejecting(c) }} disabled={isBusy} className="action-btn-sm"
                      style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: isBusy ? 0.6 : 1 }}>
                      Rechazar
                    </button>
                  </div>
                </div>
                {errors[c.id] && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{errors[c.id]}</p>}
                {c.message && (
                  <p style={{ fontSize: 13, color: "#3d3d3a", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", background: "#f7f5f0", borderRadius: 10, padding: "8px 12px" }}>
                    «{c.message}»
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={rejecting !== null}
        title="¿Rechazar el pedido?"
        message="El lugar sigue a cargo de Rumbo. Quien lo pidió ve el motivo y puede volver a pedirlo."
        confirmLabel="Rechazar"
        loading={busy !== null}
        loadingLabel="Procesando..."
        error={modalError}
        onCancel={() => setRejecting(null)}
        onConfirm={reject}
      >
        <label htmlFor="claim-reject-reason" style={{ ...labelStyle, margin: "16px 0 6px" }}>Motivo (obligatorio)</label>
        <textarea id="claim-reject-reason" value={reason} onChange={e => setReason(e.target.value)}
          rows={3} maxLength={500} placeholder="Ej: no pudimos verificar que seas el responsable."
          style={{ ...inputStyle, resize: "vertical" }} />
      </ConfirmModal>
    </div>
  )
}
