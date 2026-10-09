"use client"

// "Cerca de acá": hasta 4 lugares publicados a menos de 25 km, con la
// distancia en la card. Para armar la salida desde un lugar. Mismo carrusel
// que las secciones de la página principal; si no hay ninguno, no aparece.
import { useEffect, useState } from "react"
import SpotSection from "@/components/spots/SpotSection"
import { api } from "@/lib/api"
import type { SpotListItem } from "@/lib/types"

export default function NearbySpots({ spotId }: { spotId: number }) {
  const [spots, setSpots] = useState<SpotListItem[]>([])

  useEffect(() => {
    api.get<SpotListItem[]>(`/spots/${spotId}/nearby`)
      .then(({ data }) => setSpots(Array.isArray(data) ? data : []))
      .catch(() => {})  // es un extra: sin esto la página funciona igual
  }, [spotId])

  return <SpotSection label="Para armar la salida" title="Cerca de acá" spots={spots} count={undefined} loading={false} href={undefined} />
}
