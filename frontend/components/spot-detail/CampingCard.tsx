"use client"

import AmenitiesList from "./AmenitiesList"

interface Amenity {
  id: number
  name: string
}

interface CampingCardProps {
  amenities?: Amenity[]
}

// Los servicios del camping. El precio va en el panel de Detalles (es el del
// lugar): acá se repetía.
export default function CampingCard({ amenities }: CampingCardProps) {
  if (!amenities || amenities.length === 0) return null
  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">⛺ Información del Camping</p>
      </div>
      <AmenitiesList amenities={amenities} />
    </div>
  )
}
