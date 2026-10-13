import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PlacesPage from "@/components/places/PlacesPage"
import { findActivity, findDepartment, placesMetadata } from "@/lib/places"
import { loadPlaces } from "../../data"

// /lugares/camping/rocha: "Camping en Rocha".
export const revalidate = 3600

type Props = { params: Promise<{ slug: string; departamento: string }> }

async function resolve(params: Props["params"]) {
  const { slug, departamento } = await params
  return { activity: findActivity(slug), department: findDepartment(departamento) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { activity, department } = await resolve(params)
  return activity && department ? placesMetadata(activity, department) : {}
}

export default async function ActivityInDepartmentPage({ params }: Props) {
  const { activity, department } = await resolve(params)
  if (!activity || !department) notFound()
  const { counts, spots, total } = await loadPlaces(activity, department)
  // Sin lugares, no hay página (Google no tiene que encontrar listas vacías).
  if (total === 0) notFound()
  return <PlacesPage activity={activity} department={department} counts={counts} spots={spots} total={total} />
}
