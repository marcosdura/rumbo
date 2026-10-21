"use client"

// Vista previa de un lugar: la página tal como la va a ver la gente, aunque
// todavía no esté publicado. Para el admin (el "Ver" de su panel) y el dueño.
// Antes el "Ver" abría la página pública, que da 404 para un lugar nuevo.
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import SpotDetails, { type SpotPageData } from "@/app/spots/[slug]/SpotDetails"
import LoginRequired from "@/components/layout/LoginRequired"
import StatusPage, { secondaryButton } from "@/components/layout/StatusPage"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { api, ApiError } from "@/lib/api"


export default function SpotPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, status } = useSession()
  const token = session?.id_token
  const [spot, setSpot] = useState<SpotPageData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get<SpotPageData>(`/spots/${id}/preview`, { token })
      .then(({ data }) => setSpot(data))
      .catch(e => setError(e instanceof ApiError && (e.status === 403 || e.status === 404)
        ? "No encontramos este lugar, o no tenés permiso para verlo."
        : "No se pudo cargar la vista previa. Intentá de nuevo."))
  }, [id, token])

  if (status === "unauthenticated") return <LoginRequired page="Vista previa" />
  if (error) {
    return (
      <StatusPage emoji="🧭" title="Vista previa" text={error}>
        <button type="button" onClick={() => history.back()} style={secondaryButton}>← Volver</button>
      </StatusPage>
    )
  }
  if (!spot) return <LoadingScreen />
  return <SpotDetails spot={spot} preview />
}
