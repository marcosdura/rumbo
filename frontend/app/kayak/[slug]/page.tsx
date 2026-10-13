import type { Metadata } from "next"
import { notFound } from "next/navigation"
import JsonLd from "@/components/seo/JsonLd"
import OperatorPage from "@/components/operator-page/OperatorPage"
import { idFromSlug, slugWithId } from "@/lib/slugify"
import { breadcrumb, metaDescription, pageTitle, socialMetadata } from "@/lib/seo"
import { api } from "@/lib/api"
import { isNotFound } from "@/lib/notFound"
import { operatorDescription, operatorShareImage, kayakInfoRows } from "@/lib/operatorPage"
import type { PublicKayak, ReviewSummary } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) return { title: "Kayak | Rumbo" }
  let kayak: PublicKayak
  try {
    kayak = (await api.get<PublicKayak>(`/kayak/${id}`)).data
  } catch {
    return { title: "Kayak | Rumbo" }
  }
  const description = metaDescription(kayak.description) || operatorDescription("Servicio de kayak", kayak)
  const title = pageTitle(kayak.name)
  // La dirección con el nombre de hoy: un link con otro nombre apunta a esta.
  const path = `/kayak/${slugWithId(kayak.name, kayak.id)}`
  return { title, description, ...socialMetadata({ title, description, path, image: kayak.photo_1 ? operatorShareImage(kayak.photo_1) : null }) }
}

export default async function KayakDetailPage({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) notFound()

  const [kayakResult, summaryResult] = await Promise.allSettled([
    api.get<PublicKayak>(`/kayak/${id}`, { cache: "no-store" }),
    api.get<ReviewSummary>(`/kayak-reviews/${id}/summary`, { cache: "no-store" }),
  ])
  // Si falló la API (no es que no exista), el error sigue hasta app/error.tsx.
  if (kayakResult.status === "rejected") {
    if (isNotFound(kayakResult.reason)) notFound()
    throw kayakResult.reason
  }

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
      <JsonLd data={[jsonLd, breadcrumb([
        ...(kayak.spot_slug ? [{ name: kayak.spot_name ?? "", path: `/spots/${kayak.spot_slug}` }] : []),
        { name: kayak.name, path: `/kayak/${slugWithId(kayak.name, kayak.id)}` },
      ])]} />
      <OperatorPage
        operator={kayak}
        summary={summary}
        activity={{ emoji: "🛶", label: "Kayak" }}
        aboutTitle="Sobre el servicio"
        rows={kayakInfoRows(kayak)}
        reviewEntity="kayak"
        report={{ kind: "kayak", what: "este servicio", label: "⚑ Reportar este servicio" }}
      />
    </>
  )
}
