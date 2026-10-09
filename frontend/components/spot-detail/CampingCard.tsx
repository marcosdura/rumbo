"use client"

import AmenitiesList from "./AmenitiesList"
import DetailCell from "./DetailCell"

interface Amenity {
  id: number
  name: string
}

interface CampingCardProps {
  // El precio del lugar (spot.price), el que edita el dueño: el del detalle
  // del camping puede estar viejo.
  price?: number | null
  amenities?: Amenity[]
}

export default function CampingCard({ price, amenities }: CampingCardProps) {
  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">⛺ Información del Camping</p>
      </div>
      {price != null && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: amenities && amenities.length > 0 ? 18 : 0 }}>
          <DetailCell label="Precio por noche" value={`$${price}`} />
        </div>
      )}
      {amenities && amenities.length > 0 && (
        <AmenitiesList amenities={amenities} />
      )}
    </div>
  )
}
