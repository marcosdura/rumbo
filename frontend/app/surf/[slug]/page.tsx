import { notFound } from "next/navigation"
import JsonLd from "@/components/seo/JsonLd"
import OperatorPage from "@/components/operator-page/OperatorPage"
import { idFromSlug } from "@/lib/slugify"
import { api } from "@/lib/api"
import { operatorDescription, operatorShareImage, surfInfoRows } from "@/lib/operatorPage"
import type { PublicSurfSchool, ReviewSummary } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) return { title: "Escuela de Surf | Rumbo" }
  let school: PublicSurfSchool
  try {
    school = (await api.get<PublicSurfSchool>(`/surfschool/${id}`)).data
  } catch {
    return { title: "Escuela de Surf | Rumbo" }
  }
  const description = operatorDescription("Escuela de surf", school)
  return {
    title: `${school.name} | Rumbo`,
    description,
    openGraph: {
      title: `${school.name} | Rumbo`,
      description,
      images: school.photo_1 ? [{ url: operatorShareImage(school.photo_1), width: 1200, height: 630 }] : [],
      type: "website",
    },
  }
}

export default async function SurfSchoolPage({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) notFound()

  const [schoolResult, summaryResult] = await Promise.allSettled([
    api.get<PublicSurfSchool>(`/surfschool/${id}`, { cache: "no-store" }),
    api.get<ReviewSummary>(`/surf-reviews/${id}/summary`, { cache: "no-store" }),
  ])
  if (schoolResult.status !== "fulfilled") notFound()

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
      <JsonLd data={jsonLd} />
      <OperatorPage
        operator={school}
        summary={summary}
        activity={{ emoji: "🏄", label: "Surf" }}
        rows={surfInfoRows(school)}
        reviewEntity="surf"
        report={{ kind: "surf_school", what: "esta escuela", label: "⚑ Reportar esta escuela" }}
      />
    </>
  )
}
