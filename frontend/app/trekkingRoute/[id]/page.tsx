import React from "react"
import TrekkingRouteDetails from "./TrekkingRouteDetails"
import type { Metadata } from "next"

const Details = TrekkingRouteDetails as React.ComponentType<{ slug?: string }>

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/routes/${id}`)
  if (!res.ok) return { title: "Ruta de trekking | Rumbo" }
  const route = await res.json()
  return {
    title: `${route.name} | Rumbo`,
    description: `Ruta de trekking: ${route.name}${route.distance_km ? ` — ${route.distance_km} km` : ""}.`,
  }
}

export default async function TrekkingRoutePage({ params }: { params: any }) {
  const { id } = await params
  return <Details slug={id} />
}