"use client"

import type React from "react"
import { TREKKING_FEATURES } from "../constants"
import { s } from "../styles"
import TriStateToggle from "../ui/TriStateToggle"
import NavRow from "../ui/NavRow"
import type { TrekkingFeatures, TrekkingFeatureKey } from "../types"

export default function StepTrekkingCaracteristicas({
  trekkingFeatures, setTrekkingFeatures, featureErrors, setFeatureErrors, error, onBack, onNext, stepLabel,
}: {
  trekkingFeatures: TrekkingFeatures
  setTrekkingFeatures: React.Dispatch<React.SetStateAction<TrekkingFeatures>>
  featureErrors: Set<TrekkingFeatureKey>
  setFeatureErrors: React.Dispatch<React.SetStateAction<Set<TrekkingFeatureKey>>>
  error: string | null
  onBack: () => void
  onNext: () => void
  stepLabel?: string
}) {
  return (
    <div>
      <h2 style={s.title}>Características del lugar</h2>
      <div style={s.card}>
        <p style={s.cardTitle}>Características del lugar</p>
        <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 16, marginTop: -6 }}>
          Indicá si el lugar cuenta con cada característica. Señal móvil es opcional.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TREKKING_FEATURES.map(({ key, label, emoji }) => {
            const hasError = featureErrors.has(key)
            return (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  padding: "7px 10px", borderRadius: 10,
                  background: hasError ? "#fff5f5" : "transparent",
                  border: hasError ? "1px solid #fecaca" : "1px solid transparent",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <span style={{ fontSize: 14, color: hasError ? "#dc2626" : "#1b1b19" }}>
                  {emoji} {label}
                  {key !== "signal" && <span style={{ color: "#e53e3e", marginLeft: 3, fontSize: 12 }}>*</span>}
                </span>
                <TriStateToggle
                  value={trekkingFeatures[key]}
                  onChange={v => {
                    setTrekkingFeatures(prev => ({ ...prev, [key]: v }))
                    if (v !== null) {
                      setFeatureErrors(prev => {
                        const n = new Set(prev)
                        n.delete(key)
                        return n
                      })
                    }
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} stepLabel={stepLabel} />
    </div>
  )
}
