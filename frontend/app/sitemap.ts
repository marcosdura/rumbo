import type { MetadataRoute } from "next"
import { api } from "@/lib/api"
import { SITE_URL } from "@/lib/site"
import { placesPaths, type PlaceCount } from "@/lib/places"

const HOUR = { next: { revalidate: 3600 } }

// Lo que Google tiene que encontrar: las páginas públicas. Sin las privadas
// (antes estaba /agregar-lugar, que robots.txt bloquea) y con las rutas y los
// sectores (antes no estaban). Las escuelas de surf y los servicios de kayak
// son lugares: vienen en /spots/ids. Y las páginas /lugares/... que tienen
// lugares; la búsqueda no (Google no la indexa: las reemplazan esas páginas).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (path: string, changeFrequency: "daily" | "weekly" | "monthly", priority: number) =>
    ({ url: `${SITE_URL}${path}`, changeFrequency, priority })

  const staticRoutes: MetadataRoute.Sitemap = [
    page("/", "daily", 1.0),
    page("/legal", "monthly", 0.3),
  ]

  // Si una lista falla, el resto del sitemap sale igual.
  const [spots, trails, places] = await Promise.allSettled([
    api.get<{ id: number; slug: string }[]>("/spots/ids", HOUR),
    api.get<{ kind: "rutas" | "sectores"; spot_slug: string; slug: string }[]>("/sitemap/trails", HOUR),
    api.get<PlaceCount[]>("/sitemap/places", HOUR),
  ])
  const ok = <T,>(r: PromiseSettledResult<{ data: T[] }>): T[] => (r.status === "fulfilled" ? r.value.data : [])

  return [
    ...staticRoutes,
    // Si falla, igual van las de cada actividad.
    ...placesPaths(ok(places)).map(path => page(path, "daily", 0.9)),
    ...ok(spots).map(({ slug }) => page(`/spots/${slug}`, "weekly", 0.8)),
    ...ok(trails).map(({ kind, spot_slug, slug }) => page(`/spots/${spot_slug}/${kind}/${slug}`, "weekly", 0.7)),
  ]
}
