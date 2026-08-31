"use client"

interface Props {
  open: boolean
  confirmText: string
  setConfirmText: (v: string) => void
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteConfirmModal({ open, confirmText, setConfirmText, loading, onCancel, onConfirm }: Props) {
  if (!open) return null
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 32px", maxWidth: 400, width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#1b1b19", marginBottom: 8 }}>¿Eliminar este spot?</p>
        <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 20, lineHeight: 1.5 }}>
          Esta acción no se puede deshacer. Escribí <strong>CONFIRMAR</strong> para continuar.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="CONFIRMAR"
          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== "CONFIRMAR" || loading}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: confirmText === "CONFIRMAR" ? "var(--danger)" : "#f0ede8", color: confirmText === "CONFIRMAR" ? "#fff" : "#b0ac9e", fontSize: 13, fontWeight: 600, cursor: confirmText === "CONFIRMAR" ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
