import React from "react"
import { Metadata } from "next"
import ClimbingSectorDetails from "../../../../../components/spot-detail/ClimbingSectorDetails"
import { api } from "@/lib/api"

type Props = {
  params: Promise<{ slug: string; sectorSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sectorSlug } = await params
  const sector: any = await api.get(`/sectors/by-slug/${sectorSlug}`).then(r => r.data).catch(() => ({}))

  return {
    title: `${sector.name ?? sectorSlug} | Rumbo`,
    description: `Sector de escalada con ${sector.routes_number ?? "—"} rutas. Graduación: ${sector.min_grade}–${sector.max_grade}.`,
  }
}

export default async function SectorPage({ params }: Props) {
  const { sectorSlug } = await params
  const Details = ClimbingSectorDetails as React.ComponentType<{ slug?: string }>
  return <Details slug={sectorSlug} />
}
