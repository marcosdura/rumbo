"use client"

import type { ChangeRequest } from "./types"
import { describeRequest, capitalize } from "./changes"

interface Props {
  request: ChangeRequest
  onCancel: () => void
  onDismiss: () => void
  dismissing: boolean
}

// Mismas paletas que las variantes yellow / green / red de components/ui/Pill.
const TONES = {
  pending:  { bg: "#fef9e7", border: "#f0d98a", color: "#78590a" },
  approved: { bg: "#e8f5ee", border: "#b7dfc8", color: "var(--primary-dark)" },
  rejected: { bg: "#fdf0f0", border: "#f5c0c0", color: "#7c1d1d" },
}

export default function ChangeRequestBanner({ request, onCancel, onDismiss, dismissing }: Props) {
  if (request.status === "cancelled") return null
  const tone = TONES[request.status]
  const what = describeRequest(request)

  return (
    <div
      role="status"
      style={{
        background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color,
        borderRadius: 12, padding: "14px 16px", marginBottom: 20,
        display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13, lineHeight: 1.5,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {request.status === "pending" && (
          <>
            <p style={{ fontWeight: 700, margin: "0 0 2px" }}>⏳ Cambio en revisión: {what}</p>
            <p style={{ margin: 0 }}>
              El público sigue viendo la versión aprobada hasta que el equipo de Rumbo lo revise.
              Mientras tanto no podés pedir otro cambio de nombre, descripción o fotos.
            </p>
          </>
        )}
        {request.status === "approved" && (
          <p style={{ fontWeight: 700, margin: 0 }}>✓ {capitalize(what)}: tu cambio fue aprobado y ya está publicado.</p>
        )}
        {request.status === "rejected" && (
          <>
            <p style={{ fontWeight: 700, margin: "0 0 2px" }}>Tu cambio de {what} fue rechazado.</p>
            {request.reject_reason && <p style={{ margin: 0 }}>Motivo: {request.reject_reason}</p>}
            {request.changes.photos_added?.length ? (
              <p style={{ margin: "2px 0 0" }}>Las fotos nuevas se descartaron.</p>
            ) : null}
          </>
        )}
      </div>

      {request.status === "pending" ? (
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, flexShrink: 0,
            cursor: "pointer", fontFamily: "inherit",
            background: "#fff", color: "var(--danger)", border: "1px solid #fecaca",
          }}
        >
          Cancelar cambio
        </button>
      ) : (
        // Misma X que el cierre de ShareModal.
        <button
          onClick={onDismiss}
          disabled={dismissing}
          aria-label="Cerrar aviso"
          style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            border: "1px solid var(--border)", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 14, color: "var(--muted)", fontFamily: "inherit",
            opacity: dismissing ? 0.6 : 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
