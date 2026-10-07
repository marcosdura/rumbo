"use client"

import { s } from "../styles"
import NavRow from "../ui/NavRow"
import SpotPicker from "@/components/forms/SpotPicker"
import type { PickableSpot } from "@/components/forms/spotSearch"

export default function StepClimbingSpotSelector({
  availableSpots, loadingSpots, selectedSpotId, setSelectedSpotId, error, onBack, onNext,
}: {
  availableSpots: PickableSpot[]
  loadingSpots: boolean
  selectedSpotId: number | null
  setSelectedSpotId: (id: number) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>¿En qué lugar de escalada?</h2>
      <p style={{ fontSize: 14, color: "var(--muted-strong)", marginBottom: 20 }}>
        Podés sugerir sectores y vías en cualquier lugar de escalada. Se publican cuando el equipo de Rumbo los revisa.
      </p>
      <div style={s.form}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {loadingSpots ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Cargando lugares...</p>
          ) : availableSpots.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>No hay lugares de escalada registrados aún.</p>
          ) : (
            <SpotPicker spots={availableSpots} selectedId={selectedSpotId} onSelect={setSelectedSpotId} />
          )}
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
