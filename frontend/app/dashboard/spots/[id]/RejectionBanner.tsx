"use client"

interface Props {
  reason: string
  onResubmit: () => void
  resubmitting: boolean
  error: string | null
}

// El admin rechazó el lugar (o lo despublicó) con un motivo. Misma paleta
// red que el aviso de un cambio rechazado (ChangeRequestBanner).
export default function RejectionBanner({ reason, onResubmit, resubmitting, error }: Props) {
  return (
    <div role="status" style={{
      background: "#fdf0f0", border: "1px solid #f5c0c0", color: "#7c1d1d",
      borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 13, lineHeight: 1.5,
    }}>
      <p style={{ fontWeight: 700, margin: "0 0 2px" }}>Tu lugar no está publicado: el equipo de Rumbo pidió cambios.</p>
      <p style={{ margin: "0 0 2px" }}>Motivo: {reason}</p>
      <p style={{ margin: "0 0 12px" }}>Corregí lo que haga falta en Información y Fotos, y volvé a enviarlo a revisión.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={onResubmit}
          disabled={resubmitting}
          style={{
            padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", background: "var(--primary)", color: "#fff", border: "none",
            opacity: resubmitting ? 0.7 : 1,
          }}
        >
          {resubmitting ? "Enviando..." : "Volver a enviar a revisión"}
        </button>
        {error && <span style={{ color: "var(--danger)" }}>{error}</span>}
      </div>
    </div>
  )
}
