// GET /home (backend/home.py): populares, recién agregados y las colecciones
// del día, ya elegidas por el backend.
import type { SpotListItem } from "./types"

export type HomeSection = {
  key: string
  label: string
  title: string
  href: string
  // Cuántos lugares hay en total (para el número junto al título); 0 = no se muestra.
  total: number
  spots: SpotListItem[]
}

export type HomeData = {
  stats: { spots: number; departments: number }
  sections: HomeSection[]
}

// "128 lugares en 12 departamentos": datos reales en vez de un eslogan.
export function heroTagline(stats: HomeData["stats"] | null): string {
  if (!stats || stats.spots === 0) return "Camping, trekking, escalada, surf y más, en todo Uruguay"
  const lugares = stats.spots === 1 ? "1 lugar" : `${stats.spots} lugares`
  const deps = stats.departments === 1 ? "1 departamento" : `${stats.departments} departamentos`
  return `${lugares} para descubrir en ${deps}`
}
