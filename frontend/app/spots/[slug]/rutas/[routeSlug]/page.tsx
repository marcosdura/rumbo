import { Metadata } from "next"
import TrekkingRouteDetails from "../../../../trekkingRoute/[id]/TrekkingRouteDetails"

type Props = {
  params: Promise<{ slug: string; routeSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { routeSlug } = await params
  const route = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/routes/by-slug/${routeSlug}`
  ).then(r => r.json()).catch(() => ({}))

  return {
    title: `${route.name ?? routeSlug} | Rumbo`,
    description: `Ruta de trekking: ${route.distance_km}km, ${route.duration_hours}h. Dificultad: ${route.difficulty}.`,
  }
}

export default async function TrekkingRoutePage({ params }: Props) {
  const { routeSlug } = await params
  return <TrekkingRouteDetails slug={routeSlug} />
}
