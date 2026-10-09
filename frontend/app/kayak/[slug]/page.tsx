import { notFound } from "next/navigation"
import JsonLd from "@/components/seo/JsonLd"
import OperatorPage from "@/components/operator-page/OperatorPage"
import { idFromSlug } from "@/lib/slugify"
import { api } from "@/lib/api"
import { operatorDescription, operatorShareImage, kayakInfoRows } from "@/lib/operatorPage"
import type { PublicKayak, ReviewSummary } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) return { title: "Kayak | Rumbo" }
  let kayak: PublicKayak
  try {
    kayak = (await api.get<PublicKayak>(`/kayak/${id}`)).data
  } catch {
    return { title: "Kayak | Rumbo" }
  }
  const description = operatorDescription("Servicio de kayak", kayak)
  return {
    title: `${kayak.name} | Rumbo`,
    description,
    openGraph: {
      title: `${kayak.name} | Rumbo`,
      description,
      images: kayak.photo_1 ? [{ url: operatorShareImage(kayak.photo_1), width: 1200, height: 630 }] : [],
      type: "website",
    },
  }
}

export default async function KayakDetailPage({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) notFound()

  const [kayakResult, summaryResult] = await Promise.allSettled([
    api.get<PublicKayak>(`/kayak/${id}`, { cache: "no-store" }),
    api.get<ReviewSummary>(`/kayak-reviews/${id}/summary`, { cache: "no-store" }),
  ])
  if (kayakResult.status !== "fulfilled") notFound()

  const kayak = kayakResult.value.data
  const summary = summaryResult.status === "fulfilled" ? summaryResult.value.data : { average: null, total: 0 } satisfies ReviewSummary

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: kayak.name,
    description: operatorDescription("Servicio de kayak", kayak),
    ...(kayak.photo_1 ? { image: kayak.photo_1 } : {}),
    ...(kayak.spot_department ? { address: { "@type": "PostalAddress", addressRegion: kayak.spot_department } } : {}),
    ...(kayak.email ? { email: kayak.email } : {}),
    ...(summary.total > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average, reviewCount: summary.total } }
      : {}),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <OperatorPage
        operator={kayak}
        summary={summary}
        activity={{ emoji: "🛶", label: "Kayak" }}
        rows={kayakInfoRows(kayak)}
        reviewEntity="kayak"
        report={{ kind: "kayak", what: "este servicio", label: "⚑ Reportar este servicio" }}
      />
    </>
  )
}
