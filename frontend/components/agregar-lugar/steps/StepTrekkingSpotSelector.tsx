"use client"

import NavRow from "../ui/NavRow"
import { s } from "../styles"

export default function StepTrekkingSpotSelector({
  availableSpots, loadingSpots, selectedSpotId, setSelectedSpotId, error, onBack, onNext, stepLabel,
}: {
  availableSpots: { id: number; name: string }[]
  loadingSpots: boolean
  selectedSpotId: number | null
  setSelectedSpotId: (id: number) => void
  error: string | null
  onBack: () => void
  onNext: () => void
  stepLabel?: string
}) {
  return (
    <div>
      <h2 style={s.title}>¿A qué spot querés agregar la ruta?</h2>
      <div style={s.form}>
        {loadingSpots ? (
          <p style={{ fontSize: 13, color: "#9a9690" }}>Cargando spots...</p>
        ) : availableSpots.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9a9690" }}>No hay spots de trekking disponibles.</p>
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
      <NavRow onBack={onBack} onNext={onNext} error={error} stepLabel={stepLabel} />
    </div>
  )
}
