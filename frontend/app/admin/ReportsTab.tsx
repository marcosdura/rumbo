"use client"

import { useState } from "react"
import Pill from "@/components/ui/Pill"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { api, ApiError } from "@/lib/api"
import { label as labelStyle, input as inputStyle } from "@/lib/theme"

// GET /admin/reports: reportes abiertos agrupados por cosa reportada.
export type ReportGroup = {
  target_kind: "spot" | "review" | "surf_review" | "kayak_review" | "surf_school" | "kayak"
  target_id: number
  target: {
    exists: boolean
    title?: string
    owner_email?: string | null
    rating?: number
    comment?: string | null
    parent_name?: string
    spot?: { id: number; name: string; slug: string | null; is_approved: boolean }
  }
  actions: ("dismiss" | "delete" | "unpublish")[]
  count: number
  reports: { id: number; reason: string; reason_label: string; comment: string | null; reporter_email: string; created_at: string | null }[]
}

export const groupKey = (g: Pick<ReportGroup, "target_kind" | "target_id">) => `${g.target_kind}-${g.target_id}`

const KIND_LABELS: Record<ReportGroup["target_kind"], string> = {
  spot: "Lugar",
  review: "Reseña",
  surf_review: "Reseña de escuela de surf",
  kayak_review: "Reseña de kayak",
  surf_school: "Escuela de surf",
  kayak: "Servicio de kayak",
}

const DELETE_LABEL: Partial<Record<ReportGroup["target_kind"], string>> = {
  review: "Eliminar reseña", surf_review: "Eliminar reseña", kayak_review: "Eliminar reseña",
  surf_school: "Eliminar escuela", kayak: "Eliminar servicio",
}

interface Props {
  groups: ReportGroup[]
  loadError: string | null
  loading: boolean
  token: string | undefined
  // Se resolvió un grupo: el padre lo saca de la lista (y, si se despublicó
  // un spot, recarga los spots).
  onResolved: (group: ReportGroup, action: string) => void
}

type Pending = { group: ReportGroup; action: "delete" | "unpublish" }

export default function ReportsTab({ groups, loadError, loading, token, onResolved }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Borrar y despublicar se confirman; despublicar además pide el motivo.
  const [confirming, setConfirming] = useState<Pending | null>(null)
  const [reason, setReason] = useState("")
  const [modalError, setModalError] = useState<string | null>(null)

  async function resolve(group: ReportGroup, action: string, motive?: string) {
    const key = groupKey(group)
    setBusy(key)
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next })
    try {
      await api.post("/admin/reports/resolve", {
        target_kind: group.target_kind, target_id: group.target_id, action, reason: motive ?? null,
      }, { token })
      setConfirming(null)
      onResolved(group, action)
    } catch (e) {
      const message = e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo resolver. Intentá de nuevo."
      if (confirming) setModalError(message)
      else setErrors(prev => ({ ...prev, [key]: message }))
    } finally {
      setBusy(null)
    }
  }

  function confirm() {
    if (!confirming) return
    if (confirming.action === "unpublish" && !reason.trim()) {
      setModalError("Escribí el motivo: es lo que va a ver el dueño.")
      return
    }
    resolve(confirming.group, confirming.action, confirming.action === "unpublish" ? reason.trim() : undefined)
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, lineHeight: 1.5 }}>
        Lo que reportaron los usuarios, agrupado: lo más reportado primero. Nada se oculta solo por los
        reportes; decidís vos. Cualquier acción cierra todos los reportes de esa cosa.
      </p>

      {loadError ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>{loadError}</p>
      ) : loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
      ) : groups.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No hay reportes abiertos.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => {
            const key = groupKey(g)
            const isBusy = busy === key
            const t = g.target
            return (
              <div key={key} className="spot-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{t.exists ? t.title : "Ya no existe"}</span>
                      <Pill variant="orange" size="sm">{KIND_LABELS[g.target_kind]}</Pill>
                      <Pill variant="red" size="sm">{g.count} reporte{g.count !== 1 ? "s" : ""}</Pill>
                    </div>
                    {t.exists && t.spot && (
                      <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0 }}>
                        {t.parent_name ? `${t.parent_name} · ` : ""}en {t.spot.name}
                        {!t.spot.is_approved && " (no publicado)"}
                      </p>
                    )}
                    {t.owner_email && (
                      <a href={`mailto:${t.owner_email}`} style={{ fontSize: 11, color: "var(--primary)", textDecoration: "none" }}>
                        ✉️ {t.owner_email}
                      </a>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {t.exists && t.spot?.slug && (
                      <a href={`/spots/${t.spot.slug}`} target="_blank" rel="noopener noreferrer"
                        className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                        Ver
                      </a>
                    )}
                    <button onClick={() => resolve(g, "dismiss")} disabled={isBusy}
                      className="action-btn-sm" style={{ background: "#fff", color: "#3d3d3a", border: "1px solid var(--border)", opacity: isBusy ? 0.6 : 1 }}>
                      {isBusy ? "Procesando..." : "Descartar"}
                    </button>
                    {t.exists && g.actions.includes("unpublish") && t.spot?.is_approved && (
                      <button onClick={() => { setReason(""); setModalError(null); setConfirming({ group: g, action: "unpublish" }) }} disabled={isBusy}
                        className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: isBusy ? 0.6 : 1 }}>
                        Despublicar
                      </button>
                    )}
                    {t.exists && g.actions.includes("delete") && (
                      <button onClick={() => { setModalError(null); setConfirming({ group: g, action: "delete" }) }} disabled={isBusy}
                        className="action-btn-sm" style={{ background: "#fff", color: "var(--danger)", border: "1px solid #fecaca", opacity: isBusy ? 0.6 : 1 }}>
                        {DELETE_LABEL[g.target_kind]}
                      </button>
                    )}
                  </div>
                </div>

                {errors[key] && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{errors[key]}</p>}

                {t.exists && t.comment && (
                  <p style={{ fontSize: 13, color: "#3d3d3a", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", background: "#f7f5f0", borderRadius: 10, padding: "8px 12px" }}>
                    {t.rating != null && `${"★".repeat(t.rating)} · `}«{t.comment}»
                  </p>
                )}

                <ul style={{ borderTop: "1px solid #ede9e1", paddingTop: 10, margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {g.reports.map(r => (
                    <li key={r.id} style={{ fontSize: 12, color: "#3d3d3a", lineHeight: 1.5 }}>
                      <strong>{r.reason_label}</strong>
                      {r.comment && <> — «{r.comment}»</>}
                      <span style={{ color: "var(--muted)" }}>
                        {" "}· {r.reporter_email}
                        {r.created_at && ` · ${new Date(r.created_at).toLocaleDateString("es-UY")}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={confirming !== null}
        title={confirming?.action === "unpublish" ? "¿Despublicar este lugar?" : `¿${DELETE_LABEL[confirming?.group.target_kind ?? "review"] ?? "Eliminar"}?`}
        message={confirming?.action === "unpublish"
          ? "Deja de verse. No se borra: su dueño ve el motivo, corrige y lo vuelve a enviar."
          : "Se borra y no se puede deshacer."}
        confirmLabel={confirming?.action === "unpublish" ? "Despublicar" : "Eliminar"}
        loading={busy !== null}
        loadingLabel="Procesando..."
        error={modalError}
        onCancel={() => setConfirming(null)}
        onConfirm={confirm}
      >
        {confirming?.action === "unpublish" && (
          <>
            <label htmlFor="report-unpublish-reason" style={{ ...labelStyle, margin: "16px 0 6px" }}>Motivo (obligatorio)</label>
            <textarea id="report-unpublish-reason" value={reason} onChange={e => setReason(e.target.value)}
              maxLength={500} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </>
        )}
      </ConfirmModal>
    </div>
  )
}
