// El editor de notas del blog (app/admin/blog): el borrador que se va
// tocando y lo que se manda al backend. Sin estado de React: se prueba suelto
// en blogEditor.test.ts. El backend (backend/blog.py) vuelve a validar todo.
import type { BlogBlock, BlogCategory, BlogTrack, FreePoint, MapPoint, PointType } from "@/lib/blog"
import { slugify } from "@/lib/slugify"

export type BlogStatus = "draft" | "published"

// Cada bloque lleva una clave propia mientras se edita (para React y para
// moverlo): no se guarda.
export type DraftBlock = BlogBlock & { key: string }

// Un recorrido recién cargado todavía no tiene distancia: la calcula el
// backend (y la vista previa la muestra).
export type DraftTrack = Pick<BlogTrack, "id" | "name" | "points"> & Partial<Pick<BlogTrack, "distance_km" | "elevation_gain" | "elevation_loss">>

export type Draft = {
  slug: string
  title: string
  summary: string
  cover_image: string | null
  category: BlogCategory
  region: string
  status: BlogStatus
  featured: boolean
  points: MapPoint[]
  tracks: DraftTrack[]
  blocks: DraftBlock[]
}

// Lo que el editor sabe de un lugar de Rumbo (para nombrarlo y ubicarlo en
// el mapa del editor): viene de GET /admin/blog/posts/{id} y de
// /spots/suggest al elegirlo.
export type SpotLabel = {
  id: number
  name: string
  slug: string | null
  department: string | null
  lat: number | null
  lng: number | null
  // false: ya no está publicado; en la nota no se va a ver.
  available?: boolean
}

// Lo que devuelve el backend al leer o guardar.
export type SavedPost = {
  id: number
  slug: string
  title: string
  summary: string | null
  cover_image: string | null
  category: BlogCategory
  region: string | null
  status: BlogStatus
  featured: boolean
  map: { points: MapPoint[]; tracks: BlogTrack[] } | null
  blocks: BlogBlock[]
  published_at: string | null
  updated_at: string | null
  spots: Record<string, SpotLabel>
}

export type AdminBlogRow = {
  id: number
  slug: string
  title: string
  status: BlogStatus
  category: BlogCategory
  featured: boolean
  cover_image: string | null
  published_at: string | null
  updated_at: string | null
  created_at: string
  points_count: number
}

let counter = 0
export const newKey = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`

export const withKey = (block: BlogBlock): DraftBlock => ({ ...block, key: newKey() })

export function emptyDraft(): Draft {
  return {
    slug: "", title: "", summary: "", cover_image: null, category: "rutas", region: "",
    status: "draft", featured: false, points: [], tracks: [],
    blocks: [withKey({ type: "text", text: "" })],
  }
}

export function fromSaved(post: SavedPost): Draft {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary ?? "",
    cover_image: post.cover_image,
    category: post.category,
    region: post.region ?? "",
    status: post.status,
    featured: post.featured,
    points: post.map?.points ?? [],
    tracks: post.map?.tracks ?? [],
    blocks: post.blocks.map(withKey),
  }
}

function stripKey(block: DraftBlock): BlogBlock {
  const copy: Partial<DraftBlock> = { ...block }
  delete copy.key
  return copy as BlogBlock
}

// Lo que se manda a POST/PUT /admin/blog/posts (y a la vista previa). El
// slug vacío lo arma el backend con el título.
export function toPayload(draft: Draft, status: BlogStatus = draft.status) {
  const hasMap = draft.points.length > 0 || draft.tracks.length > 0
  return {
    slug: draft.slug.trim() || null,
    title: draft.title,
    summary: draft.summary.trim() || null,
    cover_image: draft.cover_image,
    category: draft.category,
    region: draft.region.trim() || null,
    status,
    featured: draft.featured,
    map: hasMap ? {
      points: draft.points,
      tracks: draft.tracks.map(t => ({ id: t.id, name: t.name, points: t.points })),
    } : null,
    blocks: draft.blocks.map(stripKey).map(block =>
      // La checklist se escribe un renglón por cosa: los vacíos no van.
      block.type === "checklist" ? { ...block, items: block.items.map(i => i.trim()).filter(Boolean) } : block),
  }
}

// El link que va a tener la nota: el slug escrito o, si no hay, el del título.
export const effectiveSlug = (draft: Draft) => slugify(draft.slug || draft.title)

// Un id para un punto o recorrido nuevo, a partir de su nombre y distinto de
// los que ya hay (minúsculas, números y guiones, como pide el backend).
export function uniqueId(name: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const base = slugify(name).slice(0, 34).replace(/-+$/, "") || "punto"
  if (!used.has(base)) return base
  for (let n = 2; ; n++) {
    const id = `${base}-${n}`
    if (!used.has(id)) return id
  }
}

export const takenIds = (draft: Pick<Draft, "points" | "tracks">) => [
  ...draft.points.map(p => p.id), ...draft.tracks.map(t => t.id),
]

// Coordenadas pegadas: "-41.18, -71.47" (lo que copia Google Maps con el
// botón derecho) o un link de Google Maps con "@-41.18,-71.47,15z".
export function parseCoords(text: string): { lat: number; lng: number } | null {
  const raw = text.trim()
  const at = raw.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  const plain = raw.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/)
  const m = at ?? plain
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }
}

export function freePoint(name: string, type: PointType, lat: number, lng: number, taken: Iterable<string>): FreePoint {
  return { id: uniqueId(name, taken), name: name.trim(), type, lat, lng, note: null, image: null, url: null }
}

export function move<T>(list: T[], index: number, delta: number): T[] {
  const to = index + delta
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(to, 0, item)
  return next
}

// Sacar un punto del mapa: su sección en el texto no se pierde, queda como
// texto común (si tenía algo escrito).
export function removePoint(draft: Draft, id: string): Draft {
  return {
    ...draft,
    points: draft.points.filter(p => p.id !== id),
    blocks: draft.blocks.flatMap(b => {
      if (b.type !== "point" || b.point !== id) return [b]
      return b.text?.trim() ? [{ type: "text", text: b.text, key: b.key } as DraftBlock] : []
    }),
  }
}

export function removeTrack(draft: Draft, id: string): Draft {
  return {
    ...draft,
    tracks: draft.tracks.filter(t => t.id !== id),
    blocks: draft.blocks.filter(b => !(b.type === "gpx" && b.track === id)),
  }
}

export const BLOCK_TYPES: { type: BlogBlock["type"]; label: string; needs?: "points" | "tracks" }[] = [
  { type: "heading", label: "Título" },
  { type: "text", label: "Texto" },
  { type: "image", label: "Foto" },
  { type: "gallery", label: "Galería" },
  { type: "point", label: "Punto del mapa", needs: "points" },
  { type: "spot", label: "Lugar de Rumbo" },
  { type: "tip", label: "Consejo" },
  { type: "checklist", label: "Checklist" },
  { type: "video", label: "Video" },
  { type: "gpx", label: "Recorrido GPX", needs: "tracks" },
]

// Un bloque nuevo, vacío. El de punto toma el primer punto del mapa que
// todavía no tiene sección; el de recorrido, el primero.
export function newBlock(type: BlogBlock["type"], draft: Pick<Draft, "points" | "tracks" | "blocks">): DraftBlock {
  switch (type) {
    case "heading": return withKey({ type, level: 2, text: "" })
    case "text": return withKey({ type, text: "" })
    case "image": return withKey({ type, image: "", caption: null, alt: null })
    case "gallery": return withKey({ type, images: [] })
    case "point": {
      const used = new Set(draft.blocks.flatMap(b => (b.type === "point" ? [b.point] : [])))
      const free = draft.points.find(p => !used.has(p.id)) ?? draft.points[0]
      return withKey({ type, point: free?.id ?? "", text: null })
    }
    case "spot": return withKey({ type, spot_id: 0 })
    case "tip": return withKey({ type, tone: "tip", title: null, text: "" })
    case "checklist": return withKey({ type, title: null, items: [""] })
    case "video": return withKey({ type, platform: "youtube", video_id: "", url: "", title: "", cover: null })
    case "gpx": return withKey({ type, track: draft.tracks[0]?.id ?? "" })
  }
}

// Los lugares de Rumbo que nombra el borrador (mapa y tarjetas).
export function draftSpotIds(draft: Pick<Draft, "points" | "blocks">): number[] {
  const ids = draft.points.flatMap(p => ("spot_id" in p && p.spot_id ? [p.spot_id] : []))
  ids.push(...draft.blocks.flatMap(b => (b.type === "spot" && b.spot_id ? [b.spot_id] : [])))
  return [...new Set(ids)]
}

// ¿Cambió algo desde lo guardado? Se compara lo que se mandaría.
export const sameContent = (a: Draft, b: Draft) => JSON.stringify(toPayload(a)) === JSON.stringify(toPayload(b))
