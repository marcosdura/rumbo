// Páginas de una ruta de trekking y de un sector de escalada (GET
// /routes/page/... y /sectors/page/...): se buscan dentro de su lugar.
import type { PillVariant } from "@/components/ui/Pill"
import { ROCK_TYPES, SUN_EXPOSURE, approachLabel } from "./sectorInfo"
import type { ClimbingRoute, PublicRoute, SectorDetail } from "./types"

// Fotos de rutas, sectores y vías (backend/item_photos.py).
export type ItemPhoto = { id: number; cloudinary_public_id: string }
export type PhotoTarget = "trekking_route" | "climbing_sector" | "climbing_route"
// Las publicadas, y cuántas más se pueden subir (3 menos las publicadas y
// las que están en revisión).
type WithPhotos = { photos: ItemPhoto[]; photo_slots: number }

export type Via = ClimbingRoute & WithPhotos

// El recorrido publicado (backend/route_tracks.py).
export type RouteTrackData = {
  points: [number, number, number | null][]
  distance_km: number | null
  elevation_gain: number | null
  elevation_loss: number | null
}

export type TrailSpot = { id: number; name: string; slug: string; department: string | null }

export type TrekkingRoute = PublicRoute & {
  id: number
  slug: string | null
  elevation_gain: number | null; elevation_loss: number | null
  max_altitude: number | null; min_altitude: number | null
  route_type: string | null; technical_level: string | null; physical_demand: string | null
  description: string | null
  track: RouteTrackData | null
  track_pending: boolean
} & WithPhotos

export type RoutePage = {
  route: TrekkingRoute
  spot: TrailSpot & { trekking_detail: Record<string, boolean | null> | null }
}

export type SectorPage = {
  sector: SectorDetail & WithPhotos
  spot: TrailSpot
  routes: Via[]
}

export type Stat = { icon: string; value: string; label: string }

// Solo lo que se sabe: antes la grilla mostraba "—" en todo lo que faltaba.
const known = (list: (Stat | null)[]) => list.filter((s): s is Stat => s !== null)
const stat = (icon: string, value: string | null | undefined, label: string): Stat | null =>
  value ? { icon, value, label } : null
// "1,5 h" (coma decimal, como en el resto del sitio).
const num = (v: number | null | undefined, suffix: string) => (v == null ? null : `${v.toLocaleString("es-UY")}${suffix}`)

export function routeStats(r: TrekkingRoute): Stat[] {
  return known([
    stat("📏", num(r.distance_km, " km"), "Distancia"),
    stat("⏱️", num(r.duration_hours, " h"), "Duración"),
    stat("↑", num(r.elevation_gain, " m"), "Desnivel +"),
    stat("↓", num(r.elevation_loss, " m"), "Desnivel −"),
    stat("⛰️", num(r.max_altitude, " m"), "Altitud máxima"),
    stat("🏕️", num(r.min_altitude, " m"), "Altitud mínima"),
  ])
}

export function sectorStats(s: SectorDetail): Stat[] {
  const count = s.routes_count
  return known([
    count ? stat("📍", `${count} ${count === 1 ? "vía" : "vías"}`, "Vías") : null,
    stat("🎯", s.min_grade ? (s.min_grade === s.max_grade ? s.min_grade : `${s.min_grade} – ${s.max_grade}`) : null, "Graduación"),
    stat("⛰️", num(s.max_altitude, " m"), "Altitud"),
    stat("🥾", approachLabel(s.approach_minutes), "Aproximación"),
    stat("🌤️", s.sun_exposure ? SUN_EXPOSURE[s.sun_exposure] : null, "Sol o sombra"),
    stat("🪨", s.rock_type ? ROCK_TYPES[s.rock_type] : null, "Roca"),
  ])
}

// Color del grado: francés (5, 6a+, 7c) o V (boulder).
export function gradeVariant(grade: string | null): PillVariant {
  if (!grade) return "muted"
  const g = grade.toLowerCase()
  if (g.startsWith("v")) {
    const n = parseInt(g.slice(1))
    if (n <= 3) return "green"
    if (n <= 6) return "yellow"
    if (n <= 9) return "orange"
    return "red"
  }
  const n = parseFloat(g)
  if (n <= 5) return "green"
  if (n <= 6) return "yellow"
  if (n <= 7) return "orange"
  return "red"
}
