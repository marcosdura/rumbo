"use client"

import { s } from "../styles"
import NavRow from "../ui/NavRow"

export default function StepClimbingSpotSelector({
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
      <NavRow onBack={onBack} onNext={onNext} error={null} stepLabel={stepLabel} />
      <h2 style={s.title}>Seleccioná el spot de escalada</h2>
      <div style={s.form}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {loadingSpots ? (
            <p style={{ fontSize: 13, color: "#9a9690" }}>Cargando lugares...</p>
          ) : availableSpots.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9a9690" }}>No hay spots de escalada registrados aún.</p>
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
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} stepLabel={stepLabel} />
    </div>
  )
}
