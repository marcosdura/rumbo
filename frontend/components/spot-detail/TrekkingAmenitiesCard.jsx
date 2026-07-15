"use client"

import Pill from "@/components/ui/Pill"

const AMENITIES = [
  { key: "bathrooms",     label: "Baños",            emoji: "🚽" },
  { key: "potable_water", label: "Agua potable",      emoji: "🚰" },
  { key: "pet_friendly",  label: "Pet friendly",      emoji: "🐶" },
  { key: "kids_friendly", label: "Apto niños",        emoji: "👶" },
  { key: "camping",       label: "Camping",           emoji: "⛺" },
  { key: "parking",       label: "Estacionamiento",   emoji: "🚗" },
  { key: "fire_pits",     label: "Fogones",           emoji: "🔥" },
  { key: "shelter",       label: "Refugio",           emoji: "🏠" },
  { key: "accessible",    label: "Accesible",         emoji: "♿" },
  { key: "signal",        label: "Señal móvil",       emoji: "📱" },
]

export default function TrekkingAmenitiesCard({ trekkingDetail }) {
  if (!trekkingDetail) return null

  const badges = AMENITIES.filter(a => trekkingDetail[a.key] !== null && trekkingDetail[a.key] !== undefined)
  if (badges.length === 0) return null

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">Características del lugar</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {badges.map(({ key, label, emoji }) => {
          const val = trekkingDetail[key]
          return val
            ? <Pill key={key} variant="green" size="lg" hover>{emoji} {label}</Pill>
            : <Pill key={key} variant="red" size="lg" hover>No {label}</Pill>
        })}
      </div>
    </div>
  )
}
