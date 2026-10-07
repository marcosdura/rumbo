import React from "react"
import { Metadata } from "next"
import ClimbingSectorDetails from "../../../../../components/spot-detail/ClimbingSectorDetails"
import { api } from "@/lib/api"
import { sectorDescription } from "@/lib/metadata"
import type { PublicSector } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string; sectorSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sectorSlug } = await params
  const sector = await api.get<PublicSector>(`/sectors/by-slug/${sectorSlug}`).then(r => r.data).catch(() => null)

  return {
    title: `${sector?.name ?? sectorSlug} | Rumbo`,
    description: sectorDescription(sector),
  }
}

export default async function SectorPage({ params }: Props) {
  const { sectorSlug } = await params
  const Details = ClimbingSectorDetails as React.ComponentType<{ slug?: string }>
  return <Details slug={sectorSlug} />
}
