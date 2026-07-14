"use client"

import DetailCell from "./DetailCell"

interface MotorhomeDetailProps {
  motorhomeDetail: {
    capacity?: number | null
    surface_type?: string | null
    has_water?: boolean | null
    has_electricity?: boolean | null
    has_dump_station?: boolean | null
    max_stay_nights?: number | null
  }
}

const SURFACE_LABELS: Record<string, string> = {
  cesped: "Césped", ripio: "Ripio", asfalto: "Asfalto", tierra: "Tierra",
}

export default function MotorhomeCard({ motorhomeDetail }: MotorhomeDetailProps) {
  const d = motorhomeDetail
  const rows: { label: string; value: string; emoji: string }[] = []

  if (d.capacity)         rows.push({ emoji: "🚐", label: "Capacidad", value: `${d.capacity} motorhome(s)` })
  if (d.surface_type)     rows.push({ emoji: "🪨", label: "Superficie", value: SURFACE_LABELS[d.surface_type] ?? d.surface_type })
  if (d.has_water)        rows.push({ emoji: "💧", label: "Agua", value: "Disponible" })
  if (d.has_electricity)  rows.push({ emoji: "⚡", label: "Electricidad", value: "Disponible" })
  if (d.has_dump_station) rows.push({ emoji: "🚽", label: "Dump station", value: "Disponible" })
  if (d.max_stay_nights)  rows.push({ emoji: "🌙", label: "Estadía máxima", value: `${d.max_stay_nights} noches` })

  if (rows.length === 0) return null

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">🚐 Acepta motorhomes</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {rows.map(r => (
          <DetailCell key={r.label} label={r.label} value={r.value} emoji={r.emoji} />
        ))}
      </div>
    </div>
  )
}
