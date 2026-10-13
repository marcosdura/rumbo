import { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import SpotDetails from "./SpotDetails"
import JsonLd from "@/components/seo/JsonLd"
import { api } from "@/lib/api"
import { nullIfNotFound } from "@/lib/notFound"
import type { PublicSpot } from "@/lib/types"
import { shareImageUrl } from "@/lib/spotDetail"
import { SITE_URL } from "@/lib/site"
import { breadcrumb, metaDescription, socialMetadata, spotFallbackDescription, spotTitle } from "@/lib/seo"

type Props = {
  params: Promise<{ slug: string }>
}

// generateMetadata y el componente de página piden el mismo spot por
// separado — cache() de React dedupea ambas llamadas dentro del mismo
// render en vez de pegarle dos veces al backend por cada carga.
// null = no existe; si falla la API, el error sigue (app/error.tsx).
const getSpotBySlug = cache((slug: string) =>
  nullIfNotFound(api.get<PublicSpot>(`/spots/by-slug/${slug}`).then(r => r.data)),
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let spot: PublicSpot | null
  try {
    spot = await getSpotBySlug(slug)
  } catch {
    return { title: "Rumbo" }
  }
  if (!spot) return { title: "Rumbo" }

  const mainImage = spot.images?.find(img => img.is_main) ?? spot.images?.[0]
  const imageUrl = mainImage
    ? shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, mainImage.cloudinary_public_id)
    : undefined

  const title = spotTitle(spot)
  const description = metaDescription(spot.description) || spotFallbackDescription(spot)
  return {
    title,
    description,
    ...socialMetadata({ title, description, path: `/spots/${slug}`, image: imageUrl }),
  }
}

export default async function SpotPage({ params }: Props) {
  const { slug } = await params
  const spot = await getSpotBySlug(slug)
  if (!spot) notFound()

  const mainImage = spot.images?.find(img => img.is_main) ?? spot.images?.[0]
  const imageUrl = mainImage
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${mainImage.cloudinary_public_id}`
    : undefined

  const jsonLd = {
    "@context": "https://schema.org",
    // Una escuela de surf o un servicio de kayak es un negocio; el resto, un lugar.
    "@type": spot.surf_detail || spot.kayak_service_detail ? "SportsActivityLocation" : "Place",
    name: spot.name.trim(),
    description: spot.description?.trim() || spotFallbackDescription(spot),
    url: `${SITE_URL}/spots/${slug}`,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(spot.department ? { address: { "@type": "PostalAddress", addressRegion: spot.department } } : {}),
    ...(spot.lat && spot.lng ? { geo: { "@type": "GeoCoordinates", latitude: spot.lat, longitude: spot.lng } } : {}),
    ...(spot.review_count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: spot.average_rating, reviewCount: spot.review_count } }
      : {}),
  }

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumb([{ name: spot.name, path: `/spots/${slug}` }])]} />
      <SpotDetails spot={spot} />
    </>
  )
}
