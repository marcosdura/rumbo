"use client"

import type React from "react"
import { TREKKING_FEATURES } from "../constants"
import { s } from "../styles"
import TriStateToggle from "../ui/TriStateToggle"
import NavRow from "../ui/NavRow"
import type { TrekkingFeatures } from "../types"

// Cada característica es Sí, No o No sé (arranca en No sé). Antes eran
// obligatorias y "No sé" no contaba como respuesta: quien no sabía algo no
// podía seguir. Se carga lo que se sabe; el resto queda sin dato.
export default function StepTrekkingCaracteristicas({
  trekkingFeatures, setTrekkingFeatures, error, onBack, onNext,
}: {
  trekkingFeatures: TrekkingFeatures
  setTrekkingFeatures: React.Dispatch<React.SetStateAction<TrekkingFeatures>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>Características del lugar</h2>
      <div style={s.card}>
        <p style={s.cardTitle}>Características del lugar</p>
        <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16, marginTop: -6 }}>
          Indicá lo que sepas. Si no sabés algo, dejalo en «No sé».
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TREKKING_FEATURES.map(({ key, label, emoji }) => (
            <div
              key={key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                padding: "7px 10px", borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 14, color: "#1b1b19" }}>{emoji} {label}</span>
              <TriStateToggle
                value={trekkingFeatures[key]}
                onChange={v => setTrekkingFeatures(prev => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
