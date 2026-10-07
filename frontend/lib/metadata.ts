import type { PublicRoute, PublicSector } from "./types"

// Descripciones para la metadata de rutas y sectores: solo con los datos que
// hay (antes salía "undefinedkm" o "— rutas" cuando faltaban).

export function routeDescription(route: Partial<PublicRoute> | null): string {
  const parts = [
    route?.distance_km != null ? `${route.distance_km} km` : null,
    route?.duration_hours != null ? `${route.duration_hours} h` : null,
    route?.difficulty ? `dificultad ${route.difficulty}` : null,
  ].filter(Boolean)
  return parts.length ? `Ruta de trekking: ${parts.join(", ")}.` : "Ruta de trekking en Uruguay."
}

export function sectorDescription(sector: Partial<PublicSector> | null): string {
  const count = sector?.routes_count
  const routes = count ? `${count} ${count === 1 ? "vía" : "vías"}` : null
  const grades = sector?.min_grade && sector?.max_grade
    ? (sector.min_grade === sector.max_grade ? `graduación ${sector.min_grade}` : `graduación ${sector.min_grade}–${sector.max_grade}`)
    : null
  const parts = [routes, grades].filter(Boolean)
  return parts.length ? `Sector de escalada: ${parts.join(", ")}.` : "Sector de escalada en Uruguay."
}
