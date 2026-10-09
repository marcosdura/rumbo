// Dirección vieja de una ruta de trekking (/trekkingRoute/{id}): lleva a la
// página de la ruta dentro de su lugar. Antes era una segunda copia.
import { notFound, permanentRedirect } from "next/navigation"
import { api } from "@/lib/api"

type Props = { params: Promise<{ id: string }> }

export default async function LegacyTrekkingRoutePage({ params }: Props) {
  const { id } = await params
  const route = await api
    .get<{ slug: string | null; spot_slug: string | null }>(`/routes/${encodeURIComponent(id)}`, { cache: "no-store" })
    .then(r => r.data)
    .catch(() => null)
  if (!route?.slug || !route.spot_slug) notFound()
  permanentRedirect(`/spots/${route.spot_slug}/rutas/${route.slug}`)
}
