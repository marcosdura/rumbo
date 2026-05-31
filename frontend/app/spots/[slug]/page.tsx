import { Metadata } from "next"
import SpotDetails from "./SpotDetails"

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params
  const spot = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/spots/by-slug/${slug}`
  ).then(r => r.json())

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

export default async function SpotPage({ params }) {
  const { slug } = await params
  const spot = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/spots/by-slug/${slug}`
  ).then(r => r.json())
  return <SpotDetails spot={spot} />
}
