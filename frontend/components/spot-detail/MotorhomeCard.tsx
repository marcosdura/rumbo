"use client"

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
  const rows: { label: string; value: string }[] = []

  if (d.capacity)     rows.push({ label: "Capacidad", value: `${d.capacity} motorhome(s)` })
  if (d.surface_type) rows.push({ label: "Superficie", value: SURFACE_LABELS[d.surface_type] ?? d.surface_type })
  if (d.has_water)         rows.push({ label: "Agua", value: "Disponible" })
  if (d.has_electricity)   rows.push({ label: "Electricidad", value: "Disponible" })
  if (d.has_dump_station)  rows.push({ label: "Dump station", value: "Disponible" })
  if (d.max_stay_nights)   rows.push({ label: "Estadía máxima", value: `${d.max_stay_nights} noches` })

  if (rows.length === 0) return null

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">🚐 Acepta motorhomes</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {rows.map(r => (
          <div key={r.label} style={{
            background: "#f5f4f0", border: "1px solid #e0ddd6", borderRadius: 12,
            padding: "10px 14px", minWidth: 140,
          }}>
            <p style={{ fontSize: 11, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {r.label}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
              {r.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
