"use client"

// Modal de confirmación genérico, mismo estilo visual que el modal de
// "eliminar cuenta" en profile/page.tsx (overlay + card + botones), pero
// sin el paso de escribir "CONFIRMAR" — esa fricción extra es para acciones
// irreversibles de cuenta/spot, no para algo liviano como borrar una review.
type Props = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
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
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

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
          transition: opacity 0.15s;
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

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button className="confirm-modal-cancel-btn" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className="confirm-modal-confirm-btn" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
