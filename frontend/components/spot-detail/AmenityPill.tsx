"use client"

interface AmenityPillProps {
  emoji: string
  label: string
}

export default function AmenityPill({ emoji, label }: AmenityPillProps) {
  return (
    <div className="amenity-pill hover-lift-green">
      <span className="amenity-pill-emoji">{emoji}</span>
      <span className="amenity-pill-label">{label}</span>
    </div>
  )
}
