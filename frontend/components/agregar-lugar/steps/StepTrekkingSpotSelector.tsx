"use client"

import NavRow from "../ui/NavRow"
import { s } from "../styles"

export default function StepTrekkingSpotSelector({
  availableSpots, loadingSpots, selectedSpotId, setSelectedSpotId, error, onBack, onNext,
}: {
  availableSpots: { id: number; name: string }[]
  loadingSpots: boolean
  selectedSpotId: number | null
  setSelectedSpotId: (id: number) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>¿A qué spot querés agregar la ruta?</h2>
      <p style={{ fontSize: 14, color: "var(--muted-strong)", marginBottom: 20 }}>
        Las rutas se suman a lugares que cargaste vos. Si el lugar ya está aprobado, la ruta pasa por revisión antes de publicarse.
      </p>
      <div style={s.form}>
        {loadingSpots ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Cargando spots...</p>
        ) : availableSpots.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Todavía no cargaste ningún lugar de trekking.</p>
        ) : (
          <select
            style={s.input}
            value={selectedSpotId ?? ""}
            onChange={e => setSelectedSpotId(Number(e.target.value))}
          >
            <option value="" disabled>-- Seleccioná un spot --</option>
            {availableSpots.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        )}
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
