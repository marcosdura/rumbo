import React from "react"
import { Metadata } from "next"
import TrekkingRouteDetails from "../../../../trekkingRoute/[id]/TrekkingRouteDetails"
import { api } from "@/lib/api"
import { routeDescription } from "@/lib/metadata"
import type { PublicRoute, PublicSpot } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string; routeSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { routeSlug } = await params
  const route = await api.get<PublicRoute>(`/routes/by-slug/${routeSlug}`).then(r => r.data).catch(() => null)

  return {
    title: `${route?.name ?? routeSlug} | Rumbo`,
    description: routeDescription(route),
  }
}

export default async function TrekkingRoutePage({ params }: Props) {
  const { slug, routeSlug } = await params

  const spot = await api.get<PublicSpot>(`/spots/by-slug/${slug}`).then(r => r.data).catch(() => null)

  const Details = TrekkingRouteDetails as React.ComponentType<{ slug?: string; trekkingDetail?: unknown }>
  return <Details slug={routeSlug} trekkingDetail={spot?.trekking_detail ?? null} />
}
