import type { Metadata } from "next"
import { notFound } from "next/navigation"
import JsonLd from "@/components/seo/JsonLd"
import OperatorPage from "@/components/operator-page/OperatorPage"
import { idFromSlug, slugWithId } from "@/lib/slugify"
import { breadcrumb, metaDescription, pageTitle, socialMetadata } from "@/lib/seo"
import { api } from "@/lib/api"
import { isNotFound } from "@/lib/notFound"
import { operatorDescription, operatorShareImage, surfInfoRows } from "@/lib/operatorPage"
import type { PublicSurfSchool, ReviewSummary } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) return { title: "Escuela de Surf | Rumbo" }
  let school: PublicSurfSchool
  try {
    school = (await api.get<PublicSurfSchool>(`/surfschool/${id}`)).data
  } catch {
    return { title: "Escuela de Surf | Rumbo" }
  }
  const description = metaDescription(school.description) || operatorDescription("Escuela de surf", school)
  const title = pageTitle(school.name)
  // La dirección con el nombre de hoy: un link con otro nombre apunta a esta.
  const path = `/surf/${slugWithId(school.name, school.id)}`
  return { title, description, ...socialMetadata({ title, description, path, image: school.photo_1 ? operatorShareImage(school.photo_1) : null }) }
}

export default async function SurfSchoolPage({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) notFound()

  const [schoolResult, summaryResult] = await Promise.allSettled([
    api.get<PublicSurfSchool>(`/surfschool/${id}`, { cache: "no-store" }),
    api.get<ReviewSummary>(`/surf-reviews/${id}/summary`, { cache: "no-store" }),
  ])
  // Si falló la API (no es que no exista), el error sigue hasta app/error.tsx.
  if (schoolResult.status === "rejected") {
    if (isNotFound(schoolResult.reason)) notFound()
    throw schoolResult.reason
  }

  const school = schoolResult.value.data
  const summary = summaryResult.status === "fulfilled" ? summaryResult.value.data : { average: null, total: 0 } satisfies ReviewSummary

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: school.name,
    description: operatorDescription("Escuela de surf", school),
    ...(school.photo_1 ? { image: school.photo_1 } : {}),
    ...(school.spot_department ? { address: { "@type": "PostalAddress", addressRegion: school.spot_department } } : {}),
    ...(school.email ? { email: school.email } : {}),
    ...(summary.total > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average, reviewCount: summary.total } }
      : {}),
  }

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumb([
        ...(school.spot_slug ? [{ name: school.spot_name ?? "", path: `/spots/${school.spot_slug}` }] : []),
        { name: school.name, path: `/surf/${slugWithId(school.name, school.id)}` },
      ])]} />
      <OperatorPage
        operator={school}
        summary={summary}
        activity={{ emoji: "🏄", label: "Surf" }}
        aboutTitle="Sobre la escuela"
        rows={surfInfoRows(school)}
        reviewEntity="surf"
        report={{ kind: "surf_school", what: "esta escuela", label: "⚑ Reportar esta escuela" }}
      />
    </>
  )
}
