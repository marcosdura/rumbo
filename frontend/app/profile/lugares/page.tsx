"use client"

// "Lugares que administrás": tus lugares, tus escuelas o servicios, y los
// que sugeriste como visitante.
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { MySpotSummary } from "@/lib/types"
import ProfileSubpage from "../ProfileSubpage"
import MySpotsCard from "../MySpotsCard"
import MyOperatorsCard from "../MyOperatorsCard"
import SuggestedCard, { type SuggestedSpot } from "../SuggestedCard"

function ManagedPlaces({ token }: { token: string }) {
  const [mine, setMine] = useState<MySpotSummary[] | null>(null)
  const [suggested, setSuggested] = useState<SuggestedSpot[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<MySpotSummary[]>("/spots/mine", { token }),
      api.get<SuggestedSpot[]>("/me/suggested", { token }),
    ])
      .then(([spots, sugg]) => {
        setMine(Array.isArray(spots.data) ? spots.data : [])
        setSuggested(Array.isArray(sugg.data) ? sugg.data : [])
      })
      .catch(() => setError(true))
  }, [token])

  if (error) return <p style={{ fontSize: 14, color: "var(--danger)", margin: 0 }}>No se pudieron cargar tus lugares. Recargá la página.</p>
  if (mine === null) return <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Cargando...</p>

  // Uno sugerido en revisión también figura entre los tuyos (lo manejás
  // mientras se revisa): se muestra solo en "Los que sugeriste".
  const suggestedIds = new Set(suggested.map(s => s.id))
  return (
    <>
      <MySpotsCard mySpots={mine.filter(s => !suggestedIds.has(s.id))} />
      <MyOperatorsCard token={token} />
      <SuggestedCard spots={suggested} />
    </>
  )
}

export default function ManagedPlacesPage() {
  return (
    <ProfileSubpage title="Lugares que administrás">
      {token => <ManagedPlaces token={token} />}
    </ProfileSubpage>
  )
}
