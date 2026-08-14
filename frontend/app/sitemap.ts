import type { MetadataRoute } from "next"
import { slugWithId } from "@/lib/slugify"

const BASE_URL = "https://rumbo-eight.vercel.app"
const API = process.env.NEXT_PUBLIC_API_URL!

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
    const [spotsRes, surfRes, kayakRes] = await Promise.all([
      fetch(`${API}/spots/ids`,      { next: { revalidate: 3600 } }),
      fetch(`${API}/surfschool/ids`, { next: { revalidate: 3600 } }),
      fetch(`${API}/kayak/ids`,      { next: { revalidate: 3600 } }),
    ])

    if (spotsRes.ok) {
      const spots: { id: number; slug: string }[] = await spotsRes.json()
      spotUrls = spots.map(({ slug }) => ({
        url: `${BASE_URL}/spots/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
    }

    if (surfRes.ok) {
      const schools: { id: number; name: string }[] = await surfRes.json()
      surfUrls = schools.map(({ id, name }) => ({
        url: `${BASE_URL}/surf/${slugWithId(name, id)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    }

    if (kayakRes.ok) {
      const kayaks: { id: number; name: string }[] = await kayakRes.json()
      kayakUrls = kayaks.map(({ id, name }) => ({
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
