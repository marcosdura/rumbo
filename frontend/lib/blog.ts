// El blog (backend/blog.py): tipos, el texto con formato de las notas y los
// puntos del mapa listos para mostrar (numerados, con nombre y emoji, sean
// lugares de Rumbo o puntos libres).
import type { SpotCardData } from "@/components/spots/SpotCard"
import { categoryEmoji } from "@/lib/categories"
import type { TrackPoint } from "@/lib/gpx"

export type BlogCategory = "rutas" | "refugios" | "consejos" | "equipo"

export const BLOG_CATEGORIES: { slug: BlogCategory; label: string; emoji: string }[] = [
  { slug: "rutas", label: "Rutas", emoji: "🥾" },
  { slug: "refugios", label: "Refugios", emoji: "🛖" },
  { slug: "consejos", label: "Consejos", emoji: "💡" },
  { slug: "equipo", label: "Equipo", emoji: "🎒" },
]

export const categoryLabel = (slug: string) => BLOG_CATEGORIES.find(c => c.slug === slug)?.label ?? slug

// "?categoria=rutas" del link, o null si no es una categoría.
export const asCategory = (raw: unknown): BlogCategory | null =>
  BLOG_CATEGORIES.some(c => c.slug === raw) ? (raw as BlogCategory) : null

export type PointType = "refugio" | "camping" | "mirador" | "agua" | "cima" | "estacionamiento" | "pueblo" | "otro"

export const POINT_TYPES: Record<PointType, { label: string; emoji: string }> = {
  refugio: { label: "Refugio", emoji: "🛖" },
  camping: { label: "Camping", emoji: "🏕️" },
  mirador: { label: "Mirador", emoji: "🔭" },
  agua: { label: "Agua", emoji: "💧" },
  cima: { label: "Cima", emoji: "⛰️" },
  estacionamiento: { label: "Estacionamiento", emoji: "🅿️" },
  pueblo: { label: "Pueblo", emoji: "🏘️" },
  otro: { label: "Punto", emoji: "📍" },
}

export type SpotPoint = { id: string; spot_id: number; note: string | null }
export type FreePoint = {
  id: string; name: string; type: PointType; lat: number; lng: number
  note: string | null; image: string | null; url: string | null
}
export type MapPoint = SpotPoint | FreePoint

export type BlogTrack = {
  id: string; name: string; points: TrackPoint[]
  distance_km: number; elevation_gain: number | null; elevation_loss: number | null
}

export type BlogMapData = { points: MapPoint[]; tracks: BlogTrack[] }

export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "text"; text: string }
  | { type: "image"; image: string; caption: string | null; alt: string | null }
  | { type: "gallery"; images: { image: string; caption: string | null }[] }
  | { type: "point"; point: string; text: string | null }
  | { type: "spot"; spot_id: number }
  | { type: "tip"; tone: "tip" | "warning"; title: string | null; text: string }
  | { type: "checklist"; title: string | null; items: string[] }
  | { type: "video"; platform: "youtube" | "instagram"; video_id: string; url: string; title: string; cover: string | null }
  | { type: "gpx"; track: string }

export type BlogSpot = SpotCardData & { lat?: number | null; lng?: number | null }

export type BlogSummary = {
  slug: string
  title: string
  summary: string | null
  cover_image: string | null
  category: BlogCategory
  region: string | null
  featured: boolean
  published_at: string
  updated_at: string | null
  reading_minutes: number
  points_count: number
  has_map: boolean
}

export type BlogPostData = BlogSummary & {
  map: BlogMapData | null
  blocks: BlogBlock[]
  spots: Record<string, BlogSpot>
  related: BlogSummary[]
}

// ─── Puntos del mapa ────────────────────────────────────────────────────────

export type ResolvedPoint = {
  id: string
  number: number
  name: string
  emoji: string
  kind: string
  lat: number | null
  lng: number | null
  note: string | null
  // Punto libre: su foto (cloudinary_public_id) y un link de afuera.
  image: string | null
  url: string | null
  // Lugar de Rumbo: su página y su departamento.
  spot: BlogSpot | null
  href: string | null
}

export const isSpotPoint = (p: MapPoint): p is SpotPoint => "spot_id" in p && p.spot_id != null

export function resolvePoints(map: BlogMapData | null, spots: Record<string, BlogSpot>): ResolvedPoint[] {
  if (!map) return []
  const out: ResolvedPoint[] = []
  for (const p of map.points) {
    const number = out.length + 1
    if (isSpotPoint(p)) {
      const spot = spots[String(p.spot_id)]
      // El backend ya saca los que no están publicados; por las dudas.
      if (!spot) continue
      const category = spot.categories?.[0]?.name ?? (spot.category as { name?: string } | null | undefined)?.name ?? null
      out.push({
        id: p.id, number, name: spot.name, emoji: categoryEmoji(category), kind: category ?? "Lugar",
        lat: spot.lat ?? null, lng: spot.lng ?? null, note: p.note,
        image: null, url: null, spot, href: `/spots/${spot.slug}`,
      })
    } else {
      const info = POINT_TYPES[p.type] ?? POINT_TYPES.otro
      out.push({
        id: p.id, number, name: p.name, emoji: info.emoji, kind: info.label,
        lat: p.lat, lng: p.lng, note: p.note, image: p.image, url: p.url, spot: null, href: null,
      })
    }
  }
  return out
}

// ─── Texto con formato ──────────────────────────────────────────────────────
// Lo poco que hace falta para escribir una nota, en Markdown simple:
// párrafos (línea en blanco), listas ("- "), **negrita**, *cursiva* y
// [links](https://...). Se arma como elementos de React: nunca HTML crudo.

export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; v: string }
  | { t: "i"; v: string }
  | { t: "link"; v: string; href: string }
  | { t: "br" }

export type RichBlock = { kind: "p"; inline: Inline[] } | { kind: "ul"; items: Inline[][] }

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g

// Solo links de afuera por http(s) o páginas de Rumbo ("/lugares/camping"):
// nada de javascript: ni data:.
export function safeHref(href: string): string | null {
  if (/^\/(?!\/)/.test(href)) return href
  try {
    const url = new URL(href)
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null
  } catch {
    return null
  }
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  const lines = text.split("\n")
  lines.forEach((line, n) => {
    if (n > 0) out.push({ t: "br" })
    let last = 0
    for (const m of line.matchAll(INLINE)) {
      if (m.index! > last) out.push({ t: "text", v: line.slice(last, m.index) })
      if (m[1] != null) out.push({ t: "b", v: m[1] })
      else if (m[2] != null) out.push({ t: "i", v: m[2] })
      else {
        const href = safeHref(m[4])
        out.push(href ? { t: "link", v: m[3], href } : { t: "text", v: m[3] })
      }
      last = m.index! + m[0].length
    }
    if (last < line.length) out.push({ t: "text", v: line.slice(last) })
  })
  return out
}

export function parseRichText(text: string): RichBlock[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .map((chunk): RichBlock => {
      const lines = chunk.split("\n")
      if (lines.every(l => /^\s*[-*•]\s+/.test(l))) {
        return { kind: "ul", items: lines.map(l => parseInline(l.replace(/^\s*[-*•]\s+/, ""))) }
      }
      return { kind: "p", inline: parseInline(chunk) }
    })
}

// ─── Lo demás ───────────────────────────────────────────────────────────────

export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export function publishedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Montevideo" })
}

export const readingLabel = (minutes: number) => `${minutes} min de lectura`

export function trackStats(track: Pick<BlogTrack, "distance_km" | "elevation_gain" | "elevation_loss">): string[] {
  const km = `${track.distance_km.toLocaleString("es-UY", { maximumFractionDigits: 1 })} km`
  return [
    km,
    track.elevation_gain != null ? `↗ ${track.elevation_gain} m` : null,
    track.elevation_loss != null ? `↘ ${track.elevation_loss} m` : null,
  ].filter((s): s is string => s != null)
}

// La nota destacada va arriba del inicio del blog: la marcada, o si no la última.
export function splitFeatured(posts: BlogSummary[]): { featured: BlogSummary | null; rest: BlogSummary[] } {
  const featured = posts.find(p => p.featured) ?? posts[0] ?? null
  return { featured, rest: posts.filter(p => p !== featured) }
}

// Ancla de un punto en el texto: el mapa lleva hasta ahí.
export const pointAnchor = (id: string) => `punto-${id}`
