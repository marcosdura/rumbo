"use client"

import { s } from "../styles"
import NavRow from "../ui/NavRow"
import type { Category } from "../types"

export default function StepServicioSpot({
  selectedCat, availableSpots, loadingSpots, selectedSpotId, setSelectedSpotId,
  onCreateNew, error, onBack, onNext,
}: {
  selectedCat: Category
  availableSpots: { id: number; name: string }[]
  loadingSpots: boolean
  selectedSpotId: number | null
  setSelectedSpotId: (id: number) => void
  // Sugerir una playa o laguna nueva junto con la escuela o el servicio.
  onCreateNew: () => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>
        {selectedCat.name === "Surf" ? "¿En qué playa operás?" : "¿En qué río o laguna operás?"}
      </h2>
      <p style={{ fontSize: 14, color: "var(--muted-strong)", marginBottom: 20 }}>
        {selectedCat.name === "Surf"
          ? "Seleccioná la playa donde funciona tu escuela de surf."
          : "Seleccioná el río o laguna donde ofrecés el servicio de kayak."}
        {" "}Si no está en la lista, sugerila abajo: la revisamos junto con tu {selectedCat.name === "Surf" ? "escuela" : "servicio"}.
      </p>
      <div style={s.form}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {loadingSpots ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Cargando lugares...</p>
          ) : availableSpots.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Todavía no hay {selectedCat.name === "Surf" ? "playas" : "ríos o lagunas"} cargados. Sugerí el tuyo abajo.
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
            onClick={onCreateNew}
            style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit", textAlign: "left" }}
          >
            + Mi {selectedCat.name === "Surf" ? "playa" : "río/lago"} no está en la lista
          </button>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
