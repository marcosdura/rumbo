import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { api } from "@/lib/api"
import { categoryLabel, resolvePoints, trackStats, type BlogPostData } from "@/lib/blog"
import { projector, trackPath, type LatLng } from "@/lib/blogShare"
import { nullIfNotFound } from "@/lib/notFound"

// La imagen de una nota para una historia de Instagram (1080×1920): la
// tapa de fondo, el título, el mapa dibujado (recorridos y puntos
// numerados) y adónde ir a leerla. Solo de las notas publicadas.
// ?descargar=1 la baja como archivo (el botón del editor).
const W = 1080
const H = 1920
const MAP_W = 920
const MAP_H = 470
const LEGEND_MAX = 6
const short = (name: string, max = 24) => (name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name)
const TRACK_COLORS = ["#40916c", "#e9a23b", "#5fa8d3", "#d46a7e"]

const REVALIDATE = 600

// La tapa, recortada a la historia por Cloudinary. Como data URL: si no se
// puede bajar (o en local, sin Cloudinary), va el fondo verde y listo.
async function coverDataUrl(publicId: string | null): Promise<string | null> {
  if (!publicId) return null
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const url = `https://res.cloudinary.com/${cloud}/image/upload/c_fill,g_auto,w_${W},h_${H},q_auto,f_jpg/${publicId}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/jpeg")) return null
    return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`
  } catch {
    return null
  }
}

function StoryMap({ post }: { post: BlogPostData }) {
  const points = resolvePoints(post.map, post.spots).filter(p => p.lat != null && p.lng != null)
  const tracks = post.map?.tracks ?? []
  const all: LatLng[] = [
    ...points.map(p => [p.lat!, p.lng!] as LatLng),
    ...tracks.flatMap(t => t.points.map(([lat, lng]) => [lat, lng] as LatLng)),
  ]
  if (all.length === 0) return null
  const project = projector(all, MAP_W, MAP_H, 70)
  const legend = points.slice(0, LEGEND_MAX)
  return (
    <div style={{ display: "flex", flexDirection: "column", width: MAP_W, borderRadius: 36, background: "rgba(244, 241, 232, 0.95)", overflow: "hidden" }}>
      <div style={{ display: "flex", position: "relative", width: MAP_W, height: MAP_H }}>
        <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {tracks.map((t, i) => (
            <path key={t.id} d={trackPath(t.points.map(([lat, lng]) => [lat, lng] as LatLng), project)}
              fill="none" stroke={TRACK_COLORS[i % TRACK_COLORS.length]} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        {points.map(p => {
          const { x, y } = project([p.lat!, p.lng!])
          return (
            <div key={p.id} style={{
              position: "absolute", left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: p.spot ? "#1b4332" : "#ffffff", color: p.spot ? "#ffffff" : "#1b4332",
              border: "5px solid #1b4332", fontSize: 30, fontWeight: 700,
            }}>
              {String(p.number)}
            </div>
          )
        })}
      </div>
      {/* Los nombres: con solo los números el mapa no dice nada. */}
      {legend.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", padding: "8px 40px 32px", rowGap: 14, borderTop: "2px solid rgba(27, 67, 50, 0.12)" }}>
          {legend.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, width: (MAP_W - 80) / 2, paddingTop: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, flexShrink: 0,
                background: p.spot ? "#1b4332" : "#fff", color: p.spot ? "#fff" : "#1b4332", border: "4px solid #1b4332", fontSize: 22, fontWeight: 700,
              }}>{String(p.number)}</div>
              <span style={{ fontSize: 28, color: "#1b4332", fontWeight: 600 }}>{short(p.name)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await nullIfNotFound(api.get<BlogPostData>(`/blog/posts/${encodeURIComponent(slug)}`, { next: { revalidate: REVALIDATE } }).then(r => r.data))
  if (!post) return new Response("Nota no encontrada", { status: 404 })

  const [cover, logo] = await Promise.all([
    coverDataUrl(post.cover_image),
    readFile(path.join(process.cwd(), "public", "favicon-192.png")),
  ])
  const points = resolvePoints(post.map, post.spots)
  const hasMap = points.some(p => p.lat != null) || (post.map?.tracks?.length ?? 0) > 0
  // El primer recorrido: "12,3 km · 700 m de subida" (sin flechas: la
  // letra de la imagen no las tiene).
  const track = post.map?.tracks?.[0]
  const stats = track
    ? [trackStats(track)[0], track.elevation_gain ? `${track.elevation_gain} m de subida` : null].filter(Boolean).join("  ·  ")
    : null
  const facts = [
    post.region,
    points.length ? `${points.length} ${points.length === 1 ? "punto" : "puntos"} en el mapa` : null,
    stats ?? null,
  ].filter(Boolean).join("  ·  ")
  const titleSize = post.title.length > 60 ? 76 : post.title.length > 36 ? 90 : 104

  const image = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", fontFamily: "sans-serif", color: "#fff", background: "linear-gradient(170deg, #1b4332 0%, #2d6a4f 55%, #40916c 100%)" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} width={W} height={H} alt="" style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
        )}
        {/* Oscurece arriba y abajo para que el texto se lea sobre cualquier foto. */}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "linear-gradient(180deg, rgba(10,30,20,0.72) 0%, rgba(10,30,20,0.25) 38%, rgba(10,30,20,0.55) 62%, rgba(10,30,20,0.92) 100%)" }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", width: W, height: H, padding: "120px 80px 150px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:image/png;base64,${logo.toString("base64")}`} width={72} height={72} style={{ borderRadius: 18 }} alt="" />
              <span style={{ fontSize: 50, fontWeight: 700 }}>rumbo</span>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, marginLeft: 10, padding: "8px 20px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>
                {`BLOG · ${categoryLabel(post.category).toUpperCase()}`}
              </span>
            </div>
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>{post.title}</div>
            {facts && <div style={{ display: "flex", fontSize: 36, color: "#d8f3dc" }}>{facts}</div>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
            {hasMap ? <StoryMap post={post} /> : post.summary && (
              // Sin mapa (un consejo, una lista de equipo): el resumen.
              <div style={{ display: "flex", width: MAP_W, padding: "44px 48px", borderRadius: 36, background: "rgba(244, 241, 232, 0.95)", color: "#1b4332", fontSize: 44, lineHeight: 1.3 }}>
                {post.summary}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 44, fontWeight: 700 }}>{hasMap ? "La guía completa, con el mapa" : "Leela completa en el blog"}</span>
              <span style={{ fontSize: 34, color: "#d8f3dc" }}>rumboapp.uy/blog</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  )
  if (new URL(req.url).searchParams.has("descargar")) {
    image.headers.set("Content-Disposition", `attachment; filename="rumbo-historia-${slug}.png"`)
  }
  return image
}
