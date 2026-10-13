import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PlacesPage from "@/components/places/PlacesPage"
import { findActivity, findDepartment, placesMetadata } from "@/lib/places"
import { loadPlaces } from "../data"

// /lugares/camping ("Camping en Uruguay") o /lugares/rocha ("Lugares en
// Rocha"): ningún nombre de actividad es también un departamento.
export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

function resolve(slug: string) {
  const activity = findActivity(slug)
  return { activity, department: activity ? null : findDepartment(slug) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { activity, department } = resolve((await params).slug)
  return activity || department ? placesMetadata(activity, department) : {}
}

export default async function ActivityOrDepartmentPage({ params }: Props) {
  const { activity, department } = resolve((await params).slug)
  if (!activity && !department) notFound()
  const { counts, spots, total } = await loadPlaces(activity, department)
  // Una actividad sin lugares igual tiene su página (invita a sumar uno); un
  // departamento vacío no.
  if (!activity && total === 0) notFound()
  return <PlacesPage activity={activity} department={department} counts={counts} spots={spots} total={total} />
}
