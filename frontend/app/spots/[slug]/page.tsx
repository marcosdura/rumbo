import { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import SpotDetails from "./SpotDetails"
import JsonLd from "@/components/seo/JsonLd"
import { api } from "@/lib/api"

type Props = {
  params: Promise<{ slug: string }>
}

// generateMetadata y el componente de página piden el mismo spot por
// separado — cache() de React dedupea ambas llamadas dentro del mismo
// render en vez de pegarle dos veces al backend por cada carga.
const getSpotBySlug = cache(async (slug: string) => {
  const { data } = await api.get<any>(`/spots/by-slug/${slug}`)
  return data
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let spot: any
  try {
    spot = await getSpotBySlug(slug)
  } catch {
    return { title: "Rumbo" }
  }

  const mainImage = spot.images?.find((img: any) => img.is_main) ?? spot.images?.[0]
  const imageUrl = mainImage
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${mainImage.cloudinary_public_id}`
    : undefined

  return {
    title: `${spot.name} | Rumbo`,
    description: spot.description?.slice(0, 160),
    openGraph: {
      title: `${spot.name} | Rumbo`,
      description: spot.description?.slice(0, 160),
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${spot.name} | Rumbo`,
      description: spot.description?.slice(0, 160),
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export default async function SpotPage({ params }: Props) {
  const { slug } = await params
  let spot: any
  try {
    spot = await getSpotBySlug(slug)
  } catch {
    notFound()
  }

  const mainImage = spot.images?.find((img: any) => img.is_main) ?? spot.images?.[0]
  const imageUrl = mainImage
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${mainImage.cloudinary_public_id}`
    : undefined

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: spot.name,
    description: spot.description,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(spot.department ? { address: { "@type": "PostalAddress", addressRegion: spot.department } } : {}),
    ...(spot.lat && spot.lng ? { geo: { "@type": "GeoCoordinates", latitude: spot.lat, longitude: spot.lng } } : {}),
    ...(spot.review_count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: spot.average_rating, reviewCount: spot.review_count } }
      : {}),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <SpotDetails spot={spot} />
    </>
  )
}
