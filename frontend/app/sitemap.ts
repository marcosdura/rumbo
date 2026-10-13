import type { MetadataRoute } from "next"
import { slugWithId } from "@/lib/slugify"
import { api } from "@/lib/api"
import { SITE_URL } from "@/lib/site"

const HOUR = { next: { revalidate: 3600 } }

// Lo que Google tiene que encontrar: las páginas públicas. Sin las privadas
// (antes estaba /agregar-lugar, que robots.txt bloquea) y con las rutas y los
// sectores (antes no estaban).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (path: string, changeFrequency: "daily" | "weekly" | "monthly", priority: number) =>
    ({ url: `${SITE_URL}${path}`, changeFrequency, priority })

  const staticRoutes: MetadataRoute.Sitemap = [
    page("/", "daily", 1.0),
    page("/search", "daily", 0.9),
    page("/legal", "monthly", 0.3),
  ]

  // Si una lista falla, el resto del sitemap sale igual.
  const [spots, surf, kayak, trails] = await Promise.allSettled([
    api.get<{ id: number; slug: string }[]>("/spots/ids", HOUR),
    api.get<{ id: number; name: string }[]>("/surfschool/ids", HOUR),
    api.get<{ id: number; name: string }[]>("/kayak/ids", HOUR),
    api.get<{ kind: "rutas" | "sectores"; spot_slug: string; slug: string }[]>("/sitemap/trails", HOUR),
  ])
  const ok = <T,>(r: PromiseSettledResult<{ data: T[] }>): T[] => (r.status === "fulfilled" ? r.value.data : [])

  return [
    ...staticRoutes,
    ...ok(spots).map(({ slug }) => page(`/spots/${slug}`, "weekly", 0.8)),
    ...ok(trails).map(({ kind, spot_slug, slug }) => page(`/spots/${spot_slug}/${kind}/${slug}`, "weekly", 0.7)),
    ...ok(surf).map(({ id, name }) => page(`/surf/${slugWithId(name, id)}`, "weekly", 0.7)),
    ...ok(kayak).map(({ id, name }) => page(`/kayak/${slugWithId(name, id)}`, "weekly", 0.7)),
  ]
}
