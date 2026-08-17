import React from "react"
import { Metadata } from "next"
import TrekkingRouteDetails from "../../../../trekkingRoute/[id]/TrekkingRouteDetails"
import { api } from "@/lib/api"

type Props = {
  params: Promise<{ slug: string; routeSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { routeSlug } = await params
  const route: any = await api.get(`/routes/by-slug/${routeSlug}`).then(r => r.data).catch(() => ({}))

  return {
    title: `${route.name ?? routeSlug} | Rumbo`,
    description: `Ruta de trekking: ${route.distance_km}km, ${route.duration_hours}h. Dificultad: ${route.difficulty}.`,
  }
}

export default async function TrekkingRoutePage({ params }: Props) {
  const { slug, routeSlug } = await params

  const spot: any = await api.get(`/spots/by-slug/${slug}`).then(r => r.data).catch(() => null)

  const Details = TrekkingRouteDetails as React.ComponentType<{ slug?: string; trekkingDetail?: unknown }>
  return <Details slug={routeSlug} trekkingDetail={spot?.trekking_detail ?? null} />
}
