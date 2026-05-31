import React from "react"
import TrekkingRouteDetails from "./TrekkingRouteDetails"

const Details = TrekkingRouteDetails as React.ComponentType<{ slug?: string }>

export default async function TrekkingRoutePage({ params }: { params: any }) {
  const { id } = await params
  return <Details slug={id} />
}