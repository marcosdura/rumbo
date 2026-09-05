"use client"

import { useEffect, useRef, useState } from "react"

// Modal de confirmación genérico, mismo estilo visual que el modal de
// "eliminar cuenta" en profile/page.tsx (overlay + card + botones).
//
// Por defecto no pide escribir nada: esa fricción extra es para acciones
// irreversibles de cuenta/spot, no para algo liviano como borrar una review.
// Para esos casos está `confirmPhrase`: cuando viene, el modal muestra el
// campo y deshabilita el botón hasta que el texto coincida — es el patrón que
// usaba el DeleteConfirmModal propio del panel admin, que este componente
// reemplaza.
type Props = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmPhrase?: string
  error?: string | null
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  confirmPhrase,
  error,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Al abrir: campo vacío y foco puesto, para no arrastrar lo escrito en una
  // confirmación anterior.
  useEffect(() => {
    if (!open) return
    setTyped("")
    if (confirmPhrase) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open, confirmPhrase])

  if (!open) return null

  const phraseOk = !confirmPhrase || typed === confirmPhrase
  const confirmDisabled = loading || !phraseOk

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <style>{`
        .confirm-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .confirm-modal {
          background: #f5f4f0; border: 1px solid var(--border); border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18);
          padding: 26px; width: 100%; max-width: 400px;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .confirm-modal-input {
          width: 100%; box-sizing: border-box;
          padding: 10px 14px; border-radius: 10px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px;
          outline: none; background: #fff;
          transition: border-color 0.15s;
        }
        .confirm-modal-cancel-btn {
          padding: 11px 20px; border-radius: 12px;
          border: 1px solid var(--border); background: #fff;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; color: #3d3d3a;
          transition: background 0.15s;
        }
        .confirm-modal-cancel-btn:hover { background: #f7f5f0; }
        .confirm-modal-confirm-btn {
          padding: 11px 20px; border-radius: 12px; border: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; background: var(--danger); color: #fff;
          transition: opacity 0.15s, background 0.15s;
        }
        .confirm-modal-confirm-btn:disabled { cursor: not-allowed; opacity: 0.7; }
      `}</style>

      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", margin: "0 0 10px" }}>
          {title}
        </h2>

        {message && (
          <p style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        )}

        {confirmPhrase && (
          <>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4a4a46", margin: "16px 0 6px" }}>
              Para confirmar, escribí{" "}
              <span style={{ fontWeight: 700, color: "var(--danger)" }}>{confirmPhrase}</span>
              {" "}en el campo de abajo
            </label>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmPhrase}
              className="confirm-modal-input"
              style={{
                border: typed.length > 0 && typed !== confirmPhrase
                  ? "1px solid var(--danger)"
                  : "1px solid var(--border)",
              }}
            />
          </>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "var(--danger)", margin: "12px 0 0" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button className="confirm-modal-cancel-btn" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className="confirm-modal-confirm-btn"
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={phraseOk ? undefined : { background: "#d1cdc7", color: "var(--muted)" }}
          >
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
