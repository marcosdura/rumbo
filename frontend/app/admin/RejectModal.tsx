"use client"

// Rechazar un lugar (o despublicarlo), un pedido de cambio o un aporte, con
// el motivo que ve quien lo mandó. Para un lugar el motivo es obligatorio:
// es lo que el dueño necesita para saber qué corregir.
import ConfirmModal from "@/components/ui/ConfirmModal"
import { label as labelStyle, input as inputStyle } from "@/lib/theme"
import type { AdminSpot } from "./types"

export type RejectType = "change" | "contribution" | "spot"

export default function RejectModal({ rejecting, spot, reason, setReason, loading, error, onCancel, onConfirm }: {
  rejecting: { type: RejectType; id: number } | null
  // El lugar, si lo que se rechaza es un lugar.
  spot: AdminSpot | null
  reason: string
  setReason: (reason: string) => void
  loading: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ConfirmModal
      open={rejecting !== null}
      title={spot
        ? (spot.is_approved ? "¿Despublicar este spot?" : "¿Rechazar este spot?")
        : rejecting?.type === "contribution" ? "¿Rechazar este aporte?" : "¿Rechazar este cambio?"}
      message={spot
        ? "No se borra: deja de verse (o no se publica) y el dueño ve el motivo en su panel, corrige y lo vuelve a enviar."
        : rejecting?.type === "contribution"
          ? "Se borra, junto con sus fotos. Quien lo propuso ve el rechazo en su perfil, con el motivo si lo escribís."
          : "El dueño ve el rechazo en su panel, con el motivo si lo escribís. Las fotos nuevas del pedido se borran."}
      confirmLabel={spot?.is_approved ? "Despublicar" : "Rechazar"}
      loading={loading}
      loadingLabel="Rechazando..."
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <label htmlFor="reject-reason" style={{ ...labelStyle, margin: "16px 0 6px" }}>{spot ? "Motivo (obligatorio)" : "Motivo (opcional)"}</label>
      <textarea
        id="reject-reason"
        value={reason}
        onChange={e => setReason(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Ej: la foto nueva no es del lugar."
        style={{ ...inputStyle, resize: "vertical" }}
      />
    </ConfirmModal>
  )
}
