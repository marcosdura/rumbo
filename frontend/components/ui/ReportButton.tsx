"use client"

// "Reportar" algo publicado: un spot, una reseña o una escuela/kayak
// (backend/reports.py). Sin sesión pide el login; al enviar solo muestra un
// "gracias" — quien reporta no ve qué decide el admin.
import { useState, type CSSProperties } from "react"
import { useSession } from "next-auth/react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import AuthModal from "@/components/layout/AuthModal"
import { api, ApiError } from "@/lib/api"

export type ReportTargetKind = "spot" | "review" | "surf_review" | "kayak_review" | "surf_school" | "kayak"

type Reason = { value: string; label: string }

// Los motivos vienen del backend (una sola lista); se piden una vez.
let reasonsCache: Reason[] | null = null

interface Props {
  targetKind: ReportTargetKind
  targetId: number
  // Para el título del modal: "este lugar", "esta reseña"...
  what: string
  label?: string
  className?: string
  style?: CSSProperties
}

export default function ReportButton({ targetKind, targetId, what, label = "Reportar", className, style }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [reasons, setReasons] = useState<Reason[] | null>(reasonsCache)
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function openModal() {
    if (!session?.id_token) {
      setShowAuth(true)
      return
    }
    setReason("")
    setComment("")
    setError(null)
    setOpen(true)
    if (!reasonsCache) {
      try {
        const { data } = await api.get<Reason[]>("/reports/reasons")
        reasonsCache = data
        setReasons(data)
      } catch {
        setError("No se pudieron cargar los motivos. Intentá de nuevo.")
      }
    }
  }

  async function send() {
    if (!reason) { setError("Elegí un motivo."); return }
    if (reason === "other" && !comment.trim()) { setError("Contanos qué pasa."); return }
    setSending(true)
    setError(null)
    try {
      await api.post("/reports", {
        target_kind: targetKind, target_id: targetId, reason,
        comment: comment.trim() || null,
      }, { token: session?.id_token })
      setOpen(false)
      setSent(true)
    } catch (e) {
      // 409: ya lo reportó; 400: es suyo. El backend manda el texto.
      setError(e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo enviar. Intentá de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return <span className={className} style={{ ...style, cursor: "default" }} role="status">✓ Gracias, lo vamos a revisar</span>
  }

  return (
    <>
      <button type="button" className={className} style={style} onClick={openModal}>
        {label}
      </button>

      <ConfirmModal
        open={open}
        title={`Reportar ${what}`}
        confirmLabel="Enviar reporte"
        cancelLabel="Cancelar"
        loading={sending}
        loadingLabel="Enviando..."
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={send}
      >
        <fieldset style={{ border: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
          <legend style={{ fontSize: 13, color: "#4a4a46", marginBottom: 8 }}>¿Qué pasa?</legend>
          {(reasons ?? []).map(r => (
            <label key={r.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#1b1b19", cursor: "pointer" }}>
              <input type="radio" name={`report-reason-${targetKind}-${targetId}`} value={r.value}
                checked={reason === r.value} onChange={() => setReason(r.value)} />
              {r.label}
            </label>
          ))}
        </fieldset>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4a4a46", margin: "14px 0 6px" }}>
          Comentario {reason === "other" ? "(obligatorio)" : "(opcional)"}
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          className="confirm-modal-input"
          style={{ border: "1px solid var(--border)", resize: "vertical" }}
        />
      </ConfirmModal>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
