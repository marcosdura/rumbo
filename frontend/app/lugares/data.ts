import { api } from "@/lib/api"
import type { SpotListItem } from "@/lib/types"
import type { Activity, Department, PlaceCount } from "@/lib/places"

// Se regeneran solas cada hora (como el sitemap).
export const HOUR = 3600
const CACHE = { next: { revalidate: HOUR } }
// El máximo de GET /spots: si hay más, la página manda al buscador.
export const PAGE_SIZE = 100

// Si falla la API, el error sigue hasta app/error.tsx (no es un 404).
export async function loadPlaces(activity: Activity | null, department: Department | null) {
  const [counts, list] = await Promise.all([
    api.get<PlaceCount[]>("/sitemap/places", CACHE),
    api.get<SpotListItem[]>("/spots", {
      ...CACHE,
      params: { activity: activity?.name, department: department?.name, limit: PAGE_SIZE },
    }),
  ])
  return { counts: counts.data, spots: list.data, total: list.totalCount ?? list.data.length }
}
