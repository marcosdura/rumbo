"use client"

import Pill from "@/components/ui/Pill"
import type { TrekkingDetail } from "@/lib/types"

// no: cómo se dice cuando no hay. Antes era "No " + label ("No Baños") y sin
// el ícono: "No Accesible" se leía como lo contrario de "Transporte público:
// Accesible", cuando es accesibilidad en silla de ruedas.
const AMENITIES = [
  { key: "bathrooms",     label: "Baños",            no: "Sin baños",                      emoji: "🚽" },
  { key: "potable_water", label: "Agua potable",      no: "Sin agua potable",               emoji: "🚰" },
  { key: "kids_friendly", label: "Apto niños",        no: "No apto para niños",             emoji: "👶" },
  { key: "camping",       label: "Camping",           no: "Sin camping",                    emoji: "⛺" },
  { key: "parking",       label: "Estacionamiento",   no: "Sin estacionamiento",            emoji: "🚗" },
  { key: "fire_pits",     label: "Fogones",           no: "Sin fogones",                    emoji: "🔥" },
  { key: "shelter",       label: "Refugio",           no: "Sin refugio",                    emoji: "🏠" },
  { key: "accessible",    label: "Accesible",         no: "No accesible en silla de ruedas", emoji: "♿" },
] as const

// title: en la página de una ruta dice de qué lugar son ("Características
// de Cerro Arequita"); en la del lugar, "Características del lugar".
export default function TrekkingAmenitiesCard({ trekkingDetail, title = "Características del lugar" }: {
  trekkingDetail?: TrekkingDetail | null
  title?: string
}) {
  if (!trekkingDetail) return null

  const badges = AMENITIES.filter(a => trekkingDetail[a.key] !== null && trekkingDetail[a.key] !== undefined)
  if (badges.length === 0) return null

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">{title}</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {badges.map(({ key, label, no, emoji }) => {
          const val = trekkingDetail[key]
          return val
            ? <Pill key={key} variant="green" size="lg" hover>{emoji} {label}</Pill>
            : <Pill key={key} variant="red" size="lg" hover>{emoji} {no}</Pill>
        })}
      </div>
    </div>
  )
}
