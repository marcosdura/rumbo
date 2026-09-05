"use client"

import { useState } from "react"
import { AMENITY_CATEGORIES, AMENITY_ICONS, GLAMPING_AMENITY_CATEGORIES } from "../constants"
import { s, errorHintText } from "../styles"
import NavRow from "../ui/NavRow"
import type { Category } from "../types"

export default function StepAmenities({
  selectedCat, selectedAmenities, toggleAmenity, error, onBack, onNext,
}: {
  selectedCat: Category
  selectedAmenities: string[]
  toggleAmenity: (name: string) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const isGlamping = selectedCat.name === "Glamping"
  const categories = isGlamping ? GLAMPING_AMENITY_CATEGORIES : AMENITY_CATEGORIES
  const MIN_AMENITIES = 3
  const [showMinError, setShowMinError] = useState(false)

  const belowMin = selectedAmenities.length < MIN_AMENITIES

  function handleNext() {
    if (belowMin) {
      setShowMinError(true)
      return
    }
    setShowMinError(false)
    onNext()
  }

  function handleToggle(name: string) {
    toggleAmenity(name)
    if (showMinError) setShowMinError(false)
  }

  return (
    <div>
      <h2 style={s.title}>Servicios e instalaciones</h2>
      <p style={s.subtitle}>
        Seleccioná los servicios disponibles en tu {isGlamping ? "glamping" : "camping"}.
      </p>
      <p style={{ fontSize: 13, color: showMinError ? "var(--danger)" : "var(--muted)", marginBottom: 20, fontWeight: showMinError ? 600 : 400 }}>
        Seleccioná al menos {MIN_AMENITIES} ({selectedAmenities.length}/{MIN_AMENITIES})
      </p>
      {categories.map(grp => (
        <div key={grp.id} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-strong)", marginBottom: 8 }}>
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
                  onClick={() => handleToggle(name)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 20,
                    border: `1px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                    background: sel ? "var(--primary)" : "#f7f5f0",
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
      {showMinError && (
        <p style={errorHintText}>Seleccioná al menos {MIN_AMENITIES} servicios antes de continuar.</p>
      )}
      <NavRow onBack={onBack} onNext={handleNext} error={error} />
    </div>
  )
}
