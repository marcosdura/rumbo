"use client"

import GlampingAmenitiesList, { GlampingAmenities } from "./GlampingAmenitiesList"
import DetailCell from "./DetailCell"

interface GlampingUnit {
  id?: number
  accommodation_type?: string | null
  capacity?: number | null
  price_per_night?: number | null
  min_nights?: number | null
}

interface GlampingCardProps {
  glampingDetail: GlampingUnit[]
  glampingAmenities?: GlampingAmenities | null
}

export default function GlampingCard({ glampingDetail, glampingAmenities }: GlampingCardProps) {
  const multi = glampingDetail.length > 1

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">🛖 Información del Glamping</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: glampingAmenities ? 18 : 0 }}>
        {glampingDetail.map((unit, index) => (
          <div key={unit.id ?? index}>
            {multi && (
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", margin: "0 0 8px" }}>
                {unit.accommodation_type
                  ? unit.accommodation_type.charAt(0).toUpperCase() + unit.accommodation_type.slice(1)
                  : `Tipo ${index + 1}`}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {unit.accommodation_type && !multi && (
                <DetailCell label="Tipo de alojamiento" value={unit.accommodation_type} capitalize />
              )}
              {unit.capacity != null && (
                <DetailCell label="Capacidad" value={`${unit.capacity} persona${unit.capacity !== 1 ? "s" : ""}`} />
              )}
              {unit.price_per_night != null && (
                <DetailCell label="Precio por noche" value={`$${unit.price_per_night}`} />
              )}
              {unit.min_nights != null && (
                <DetailCell label="Mínimo de noches" value={`${unit.min_nights} noche${unit.min_nights !== 1 ? "s" : ""}`} />
              )}
            </div>
            {multi && index < glampingDetail.length - 1 && (
              <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0 0" }} />
            )}
          </div>
        ))}
      </div>

      {glampingAmenities && (
        <GlampingAmenitiesList amenities={glampingAmenities} />
      )}
    </div>
  )
}
