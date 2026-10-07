import React from "react"
import TrekkingRouteDetails from "./TrekkingRouteDetails"
import type { Metadata } from "next"
import { api } from "@/lib/api"
import { routeDescription } from "@/lib/metadata"
import type { PublicRoute } from "@/lib/types"

type Props = { params: Promise<{ id: string }> }

const Details = TrekkingRouteDetails as React.ComponentType<{ slug?: string }>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  let route: PublicRoute
  try {
    route = (await api.get<PublicRoute>(`/routes/${id}`)).data
  } catch {
    return { title: "Ruta de trekking | Rumbo" }
  }
  return {
    title: `${route.name} | Rumbo`,
    description: routeDescription(route),
  }
}

export default async function TrekkingRoutePage({ params }: Props) {
  const { id } = await params
  return <Details slug={id} />
}