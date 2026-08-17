import React from "react"
import TrekkingRouteDetails from "./TrekkingRouteDetails"
import type { Metadata } from "next"
import { api } from "@/lib/api"

const Details = TrekkingRouteDetails as React.ComponentType<{ slug?: string }>

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { id } = await params
  let route: any
  try {
    route = (await api.get<any>(`/routes/${id}`)).data
  } catch {
    return { title: "Ruta de trekking | Rumbo" }
  }
  return {
    title: `${route.name} | Rumbo`,
    description: `Ruta de trekking: ${route.name}${route.distance_km ? ` — ${route.distance_km} km` : ""}.`,
  }
}

export default async function TrekkingRoutePage({ params }: { params: any }) {
  const { id } = await params
  return <Details slug={id} />
}