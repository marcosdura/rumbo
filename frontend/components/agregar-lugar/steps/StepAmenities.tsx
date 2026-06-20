"use client"

import { AMENITY_CATEGORIES, AMENITY_ICONS, GLAMPING_AMENITY_CATEGORIES } from "../constants"
import NavRow from "../ui/NavRow"
import MotorhomeFields from "../../ui/MotorhomeFields"
import type { Category, MotorhomeAmenities } from "../types"

export default function StepAmenities({
  selectedCat, selectedAmenities, toggleAmenity, motorhome, setMotorhome, error, onBack, onNext,
}: {
  selectedCat: Category
  selectedAmenities: string[]
  toggleAmenity: (name: string) => void
  motorhome: MotorhomeAmenities
  setMotorhome: (next: MotorhomeAmenities) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const isGlamping = selectedCat.name === "Glamping"
  const categories = isGlamping ? GLAMPING_AMENITY_CATEGORIES : AMENITY_CATEGORIES

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 20 }}>
        Servicios e instalaciones
      </h2>
      <p style={{ fontSize: 14, color: "#7a7669", marginBottom: 20 }}>
        Seleccioná los servicios disponibles en tu {isGlamping ? "glamping" : "camping"}. Podés dejar todo sin seleccionar.
      </p>
      {categories.map(grp => (
        <div key={grp.id} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#7a7669", marginBottom: 8 }}>
            {grp.emoji} {grp.label}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {grp.names.map(name => {
              const icon = AMENITY_ICONS[name] ?? ""
              const sel = selectedAmenities.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleAmenity(name)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 20,
                    border: `1px solid ${sel ? "#2d6a4f" : "#e0ddd6"}`,
                    background: sel ? "#2d6a4f" : "#f7f5f0",
                    color: sel ? "#fff" : "#1b1b19",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {icon && <span>{icon}</span>}
                  <span>{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <MotorhomeFields value={motorhome} onChange={setMotorhome} />
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
