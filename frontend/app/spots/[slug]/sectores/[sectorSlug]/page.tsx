import React from "react"
import { Metadata } from "next"
import ClimbingSectorDetails from "../../../../sectors/[id]/page"

type Props = {
  params: Promise<{ slug: string; sectorSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sectorSlug } = await params
  const sector = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/sectors/by-slug/${sectorSlug}`
  ).then(r => r.json()).catch(() => ({}))

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
