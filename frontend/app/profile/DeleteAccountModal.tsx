"use client"

import type { RefObject } from "react"
import { useModalA11y } from "@/lib/useModalA11y"

interface Props {
  open: boolean
  confirmText: string
  setConfirmText: (v: string) => void
  deleteError: string
  deleting: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteAccountModal({
  open, confirmText, setConfirmText, deleteError, deleting, inputRef, onCancel, onConfirm,
}: Props) {
  const panelRef = useModalA11y(open, onCancel, inputRef)

  if (!open) return null

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div
        ref={panelRef}
        className="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-modal-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="delete-account-modal-title" style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: "0 0 12px" }}>
          ¿Eliminar tu cuenta?
        </h2>

        <p style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.6, margin: "0 0 16px" }}>
          Esta acción es permanente y no se puede deshacer. Al eliminar tu cuenta:
        </p>

        <ul style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.8, margin: "0 0 20px", paddingLeft: 20 }}>
          <li>Tu perfil y datos personales serán eliminados</li>
          <li>Todas tus reviews en spots, escuelas de surf y servicios de kayak serán eliminadas</li>
          <li>No podrás recuperar esta información</li>
        </ul>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4a4a46", marginBottom: 6 }}>
          Para confirmar, escribí <span style={{ fontWeight: 700, color: "var(--danger)" }}>CONFIRMAR</span> en el campo de abajo
        </label>
        <input
          ref={inputRef}
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="CONFIRMAR"
          className="delete-confirm-input"
          style={{
            border: confirmText.length > 0 && confirmText !== "CONFIRMAR"
              ? "1px solid var(--danger)"
              : "1px solid var(--border)",
          }}
        />

        {deleteError && (
          <p style={{ fontSize: 13, color: "var(--danger)", margin: "8px 0 0" }}>{deleteError}</p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="delete-btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="delete-btn-confirm"
            disabled={confirmText !== "CONFIRMAR" || deleting}
            onClick={onConfirm}
            style={{
              background: confirmText === "CONFIRMAR" ? "var(--danger)" : "#d1cdc7",
              color: confirmText === "CONFIRMAR" ? "#fff" : "var(--muted)",
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? "Eliminando..." : "Eliminar cuenta definitivamente"}
          </button>
        </div>
      </div>
    </div>
  )
}
