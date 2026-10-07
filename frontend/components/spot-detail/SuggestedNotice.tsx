"use client"

// En la página de un lugar que sugirió un visitante (no su responsable):
// avisa que la información está a confirmar y le ofrece al responsable o
// dueño reclamarlo (backend/claims.py). Hace falta sesión; el pedido pasa
// a revisión y se le avisa en la app cuando se resuelve.
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import AuthModal from "@/components/layout/AuthModal"
import { api, ApiError } from "@/lib/api"

const banner = {
  borderRadius: 12, padding: "10px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13,
  marginBottom: 16, display: "flex", alignItems: "center", gap: 10, lineHeight: 1.4, flexWrap: "wrap" as const,
  background: "#fdf6ec", border: "1px solid #f0d9b5", color: "#7a5418",
}

const linkButton = {
  background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit",
  fontSize: 13, fontWeight: 600, color: "#7a5418", textDecoration: "underline",
}

export default function SuggestedNotice({ spotId }: { spotId: number }) {
  const { data: session } = useSession()
  const token = session?.id_token
  const [showAuth, setShowAuth] = useState(false)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Ya pidió hacerse cargo (antes o recién): en vez del botón, el estado.
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<{ pending: boolean }>(`/spots/${spotId}/claims/mine`, { token })
      .then(({ data }) => setPending(data.pending))
      .catch(() => {})
  }, [spotId, token])

  function start() {
    if (!token) { setShowAuth(true); return }
    setMessage("")
    setError(null)
    setOpen(true)
  }

  async function send() {
    setSending(true)
    setError(null)
    try {
      await api.post(`/spots/${spotId}/claims`, { message: message.trim() || null }, { token })
      setOpen(false)
      setPending(true)
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 422 ? e.message : "No se pudo enviar. Intentá de nuevo.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div role="note" style={banner}>
      <span style={{ flex: 1, minWidth: 220 }}>
        🎒 Este lugar lo sugirió un visitante, no su responsable: la información está a confirmar.
      </span>
      {pending ? (
        <span role="status" style={{ fontWeight: 600 }}>⏳ Tu pedido para hacerte cargo está en revisión.</span>
      ) : (
        <button type="button" style={linkButton} onClick={start}>¿Sos el responsable o dueño? Reclamalo</button>
      )}

      <ConfirmModal
        open={open}
        title="Reclamar este lugar"
        confirmLabel="Enviar pedido"
        confirmVariant="primary"
        loading={sending}
        loadingLabel="Enviando..."
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={send}
      >
        <div style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6, marginTop: 8 }}>
          <p style={{ margin: "0 0 8px" }}>
            Tu pedido pasa a revisión: el equipo de Rumbo verifica que seas el responsable o dueño
            y te avisamos acá en la app (en la campanita 🔔) cuando se confirme.
          </p>
          <p style={{ margin: 0 }}>
            Si se aprueba, vas a poder administrar el lugar desde tu perfil: editar los datos y las fotos, y ver sus reseñas.
          </p>
        </div>
        <label htmlFor={`claim-message-${spotId}`} style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4a4a46", margin: "14px 0 6px" }}>
          ¿Cómo podemos verificarlo? (opcional)
        </label>
        <textarea
          id={`claim-message-${spotId}`}
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Ej: soy el encargado, nuestro Instagram es @..., teléfono del lugar..."
          className="confirm-modal-input"
          style={{ border: "1px solid var(--border)", resize: "vertical" }}
        />
      </ConfirmModal>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
