"use client"

import { s } from "../styles"
import NavRow from "../ui/NavRow"

export default function StepClimbingSectorSelector({
  availableSectors, loadingSectors, selectedSectorId, setSelectedSectorId, error, onBack, onNext,
}: {
  availableSectors: { id: number; name: string }[]
  loadingSectors: boolean
  selectedSectorId: number | null
  setSelectedSectorId: (id: number) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>Seleccioná el sector</h2>
      <div style={s.form}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {loadingSectors ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Cargando sectores...</p>
          ) : availableSectors.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Este spot no tiene sectores registrados aún.</p>
          ) : (
            <select
              style={s.input}
              value={selectedSectorId ?? ""}
              onChange={e => setSelectedSectorId(Number(e.target.value))}
            >
              <option value="" disabled>-- Seleccioná un sector --</option>
              {availableSectors.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
