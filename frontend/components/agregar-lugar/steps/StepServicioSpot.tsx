"use client"

import { s } from "../styles"
import NavRow from "../ui/NavRow"
import type { Category } from "../types"

export default function StepServicioSpot({
  selectedCat, availableSpots, loadingSpots, selectedSpotId, setSelectedSpotId,
  setCreatingNewSpot, error, onBack, onNext, stepLabel,
}: {
  selectedCat: Category
  availableSpots: { id: number; name: string }[]
  loadingSpots: boolean
  selectedSpotId: number | null
  setSelectedSpotId: (id: number) => void
  setCreatingNewSpot: (v: boolean) => void
  error: string | null
  onBack: () => void
  onNext: () => void
  stepLabel?: string
}) {
  return (
    <div>
      <h2 style={s.title}>
        {selectedCat.name === "Surf" ? "¿En qué playa operás?" : "¿En qué río o laguna operás?"}
      </h2>
      <p style={{ fontSize: 14, color: "#7a7669", marginBottom: 20 }}>
        {selectedCat.name === "Surf"
          ? "Seleccioná la playa donde funciona tu escuela de surf."
          : "Seleccioná el río o laguna donde ofrecés el servicio de kayak."}
      </p>
      <div style={s.form}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {loadingSpots ? (
            <p style={{ fontSize: 13, color: "#9a9690" }}>Cargando lugares...</p>
          ) : availableSpots.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9a9690" }}>
              No hay lugares disponibles aún. Podés agregar el tuyo abajo.
            </p>
          ) : (
            <select
              style={s.input}
              value={selectedSpotId ?? ""}
              onChange={e => setSelectedSpotId(Number(e.target.value))}
            >
              <option value="" disabled>-- Seleccioná un lugar --</option>
              {availableSpots.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setCreatingNewSpot(true)}
            style={{ background: "none", border: "none", color: "#2d6a4f", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit", textAlign: "left" }}
          >
            + Mi {selectedCat.name === "Surf" ? "playa" : "río/lago"} no está en la lista
          </button>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} stepLabel={stepLabel} />
    </div>
  )
}
