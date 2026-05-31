import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const spots = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/spots`
  ).then(r => r.json()).catch(() => [])

  const spotUrls = Array.isArray(spots) ? spots.map((spot: any) => ({
    url: `https://rumbo-eight.vercel.app/spots/${spot.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  })) : []

  return [
    {
      url: "https://rumbo-eight.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://rumbo-eight.vercel.app/search",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...spotUrls,
  ]
}
