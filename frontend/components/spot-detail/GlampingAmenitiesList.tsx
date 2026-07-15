"use client"

import Pill from "@/components/ui/Pill"

export interface GlampingAmenities {
  private_bathroom?: boolean | null
  electricity?: boolean | null
  wifi?: boolean | null
  breakfast_included?: boolean | null
  pet_friendly?: boolean | null
  heating?: boolean | null
  air_conditioning?: boolean | null
  kitchen?: boolean | null
  towels_included?: boolean | null
  parking?: boolean | null
}

const GLAMPING_AMENITY_LABELS: Record<keyof GlampingAmenities, { label: string; emoji: string }> = {
  private_bathroom:   { label: "Baño privado",       emoji: "🚿" },
  electricity:        { label: "Electricidad",       emoji: "⚡" },
  wifi:                { label: "WiFi",               emoji: "🛜" },
  breakfast_included: { label: "Desayuno incluido",  emoji: "🥐" },
  pet_friendly:        { label: "Acepta mascotas",    emoji: "🐶" },
  heating:             { label: "Calefacción",        emoji: "🌡️" },
  air_conditioning:    { label: "Aire acondicionado", emoji: "❄️" },
  kitchen:             { label: "Cocina equipada",    emoji: "🍳" },
  towels_included:     { label: "Ropa de cama",       emoji: "🛌" },
  parking:             { label: "Estacionamiento",    emoji: "🚗" },
}

interface Props {
  amenities: GlampingAmenities
}

export default function GlampingAmenitiesList({ amenities }: Props) {
  const active = Object.entries(amenities || {}).filter(([, v]) => v === true)

  if (active.length === 0) return null

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {active.map(([key]) => {
        const meta = GLAMPING_AMENITY_LABELS[key as keyof GlampingAmenities]
        if (!meta) return null
        return (
          <Pill key={key} variant="neutral" size="lg" hover>
            {meta.emoji} {meta.label}
          </Pill>
        )
      })}
    </div>
  )
}
