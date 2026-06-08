import type { Metadata } from "next"
import ClimbingSectorDetails from "./ClimbingSectorDetails"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectors/${id}`)
  if (!res.ok) return { title: "Sector de escalada | Rumbo" }
  const sector = await res.json()
  const description = sector.routes_count
    ? `Sector de escalada: ${sector.name} — ${sector.routes_count} rutas.`
    : `Sector de escalada: ${sector.name}.`
  return {
    title: `${sector.name} | Rumbo`,
    description,
    openGraph: {
      title: `${sector.name} | Rumbo`,
      description,
      type: "website",
    },
  }
}

export default function SectorPage() {
  return <ClimbingSectorDetails />
}
