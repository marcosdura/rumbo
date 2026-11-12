// Para llevar las notas del blog a Instagram: los links con UTM (para saber
// en Analytics qué trajo cada visita) y el mapa dibujado de la imagen para
// historias (app/blog/[slug]/historia). Sin React: se prueba en
// blogShare.test.ts.
import { SITE_URL } from "@/lib/site"

// Dónde va el link: en la bio, en una historia (sticker de link), en el
// texto de un posteo o de un reel.
export type InstagramPlace = "bio" | "historia" | "posteo" | "reel"

export const INSTAGRAM_PLACES: { place: InstagramPlace; label: string }[] = [
  { place: "historia", label: "Historia (sticker de link)" },
  { place: "bio", label: "Link de la bio" },
  { place: "posteo", label: "Posteo" },
  { place: "reel", label: "Reel" },
]

// rumboapp.uy/blog/<slug>?utm_source=instagram&utm_medium=historia&utm_campaign=<slug>
export function instagramLink(path: string, place: InstagramPlace, campaign: string, base = SITE_URL): string {
  const url = new URL(path, base)
  url.searchParams.set("utm_source", "instagram")
  url.searchParams.set("utm_medium", place)
  url.searchParams.set("utm_campaign", campaign)
  return url.toString()
}

export const storyImagePath = (slug: string) => `/blog/${slug}/historia`

// ─── El mapa de la historia ─────────────────────────────────────────────────

export type LatLng = [number, number]
export type Projected = { x: number; y: number }

// Lleva coordenadas a un rectángulo de width × height (con margen), sin
// deformar: un grado de longitud mide menos que uno de latitud lejos del
// ecuador. Un solo punto queda en el centro.
export function projector(all: LatLng[], width: number, height: number, pad = 40): (p: LatLng) => Projected {
  if (all.length === 0) return () => ({ x: width / 2, y: height / 2 })
  const lats = all.map(p => p[0])
  const lngs = all.map(p => p[1])
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const k = Math.cos((midLat * Math.PI) / 180)
  const minX = Math.min(...lngs) * k
  const maxX = Math.max(...lngs) * k
  const minY = Math.min(...lats)
  const maxY = Math.max(...lats)
  const spanX = maxX - minX
  const spanY = maxY - minY
  const scale = spanX === 0 && spanY === 0 ? 1 : Math.min(
    spanX ? (width - 2 * pad) / spanX : Infinity,
    spanY ? (height - 2 * pad) / spanY : Infinity,
  )
  // Centrado en el lado que sobra.
  const offX = (width - spanX * scale) / 2
  const offY = (height - spanY * scale) / 2
  return ([lat, lng]) => ({
    x: Math.round((offX + (lng * k - minX) * scale) * 10) / 10,
    // En la imagen, y crece hacia abajo: el norte arriba.
    y: Math.round((offY + (maxY - lat) * scale) * 10) / 10,
  })
}

// Un recorrido como `d` de un <path> SVG, salteando puntos (la imagen no
// necesita miles).
export function trackPath(points: LatLng[], project: (p: LatLng) => Projected, max = 400): string {
  if (points.length < 2) return ""
  const step = Math.max(1, Math.ceil(points.length / max))
  const kept = points.filter((_, i) => i % step === 0 || i === points.length - 1)
  return kept.map((p, i) => {
    const { x, y } = project(p)
    return `${i === 0 ? "M" : "L"}${x} ${y}`
  }).join(" ")
}
