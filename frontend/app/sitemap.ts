import type { MetadataRoute } from "next"
import { slugWithId } from "@/lib/slugify"
import { api } from "@/lib/api"

const BASE_URL = "https://rumbo-eight.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,              changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/search`,        changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/agregar-lugar`, changeFrequency: "monthly", priority: 0.6 },
  ]

  let spotUrls:  MetadataRoute.Sitemap = []
  let surfUrls:  MetadataRoute.Sitemap = []
  let kayakUrls: MetadataRoute.Sitemap = []

  try {
    const [spotsResult, surfResult, kayakResult] = await Promise.allSettled([
      api.get<{ id: number; slug: string }[]>("/spots/ids",      { next: { revalidate: 3600 } }),
      api.get<{ id: number; name: string }[]>("/surfschool/ids", { next: { revalidate: 3600 } }),
      api.get<{ id: number; name: string }[]>("/kayak/ids",      { next: { revalidate: 3600 } }),
    ])

    if (spotsResult.status === "fulfilled") {
      spotUrls = spotsResult.value.data.map(({ slug }) => ({
        url: `${BASE_URL}/spots/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
    }

    if (surfResult.status === "fulfilled") {
      surfUrls = surfResult.value.data.map(({ id, name }) => ({
        url: `${BASE_URL}/surf/${slugWithId(name, id)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    }

    if (kayakResult.status === "fulfilled") {
      kayakUrls = kayakResult.value.data.map(({ id, name }) => ({
        url: `${BASE_URL}/kayak/${slugWithId(name, id)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    }
  } catch {
    // fetch fallido — devuelve solo las rutas estáticas
  }

  return [...staticRoutes, ...spotUrls, ...surfUrls, ...kayakUrls]
}
