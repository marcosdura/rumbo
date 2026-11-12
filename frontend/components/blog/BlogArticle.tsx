"use client"

// Una nota del blog. Con mapa, en la compu: el texto a la izquierda y el
// mapa a la derecha, fijo mientras se baja; pasar por un punto del texto
// resalta su pin. En el celular: un mapa chico arriba y "🗺️ Ver mapa"
// flotando, que lo abre a pantalla completa (MapPanel, como la búsqueda).
// Sin mapa: una sola columna para leer cómodo.
import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import MapPanel from "@/components/maps/MapPanel"
import ShareButton from "@/components/ui/ShareButton"
import {
  categoryLabel, publishedLabel, readingLabel, resolvePoints, type BlogPostData,
} from "@/lib/blog"
import BlogBlocks from "./BlogBlocks"
import BlogCard from "./BlogCard"
import BlogImage from "./BlogImage"
import SaveAllButton from "./SaveAllButton"
import "./blog.css"

const BlogMap = dynamic(() => import("./BlogMap"), {
  ssr: false,
  loading: () => <div className="blog-map-loading">Cargando mapa…</div>,
})

const MOBILE = "(max-width: 768px)"
const isMobile = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(MOBILE).matches

export default function BlogArticle({ post }: { post: BlogPostData }) {
  const points = useMemo(() => resolvePoints(post.map, post.spots), [post.map, post.spots])
  const tracks = useMemo(() => post.map?.tracks ?? [], [post.map])
  const pointsById = useMemo(() => new Map(points.map(p => [p.id, p])), [points])
  const tracksById = useMemo(() => new Map(tracks.map(t => [t.id, t])), [tracks])
  const sectionIds = useMemo(
    () => new Set(post.blocks.flatMap(b => (b.type === "point" ? [b.point] : []))),
    [post.blocks],
  )
  const hasMap = points.some(p => p.lat != null) || tracks.length > 0
  // Los lugares de Rumbo de la nota (mapa y tarjetas): "Guardar todos".
  const spotIds = useMemo(() => Object.values(post.spots).map(s => s.id), [post.spots])

  const [mapOpen, setMapOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ id: string; at: number } | null>(null)
  // El botón flotante aparece cuando el mapa chico ya quedó arriba.
  const [previewGone, setPreviewGone] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const showPoint = useCallback((id: string) => {
    setSelected({ id, at: Date.now() })
    if (isMobile()) setMapOpen(true)
  }, [])
  const pickFromMap = useCallback((id: string) => setActiveId(id), [])

  useEffect(() => {
    const el = previewRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setPreviewGone(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMap])

  // "Leer en la nota" desde el globo del mapa: cierra la pantalla completa.
  useEffect(() => {
    if (!mapOpen) return
    const close = () => setMapOpen(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("hashchange", close)
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("hashchange", close); window.removeEventListener("keydown", onKey) }
  }, [mapOpen])

  const date = publishedLabel(post.published_at)
  const meta = [date, readingLabel(post.reading_minutes), post.region].filter(Boolean).join(" · ")

  return (
    <div className="blog-page">
      <article className={`blog-post${hasMap ? " has-map" : ""}`}>
        <header className="blog-post-header">
          <nav className="blog-crumbs" aria-label="Migas de pan">
            <Link href="/blog">Blog</Link>
            <span aria-hidden="true">›</span>
            <Link href={`/blog?categoria=${post.category}`}>{categoryLabel(post.category)}</Link>
          </nav>
          <h1 className="blog-title">{post.title}</h1>
          {post.summary && <p className="blog-summary">{post.summary}</p>}
          <div className="blog-meta-row">
            <p className="blog-meta">{meta}</p>
            <div className="blog-meta-actions">
              <SaveAllButton spotIds={spotIds} slug={post.slug} />
              <ShareButton name={post.title} />
            </div>
          </div>
          {post.cover_image && (
            <div className="blog-cover">
              <BlogImage id={post.cover_image} alt={post.title} width={1400} height={800} sizes="(max-width: 768px) 100vw, 720px" priority />
            </div>
          )}
        </header>

        {hasMap && (
          <MapPanel open={mapOpen} onClose={() => setMapOpen(false)} className="blog-map-col" label={`Mapa de ${post.title}`}>
            <div className="map-panel-inner blog-map-box" ref={previewRef}>
              <BlogMap
                points={points}
                tracks={tracks}
                activeId={activeId}
                selected={selected}
                sectionIds={sectionIds}
                onPick={pickFromMap}
              />
              {!mapOpen && (
                <button type="button" className="blog-map-overlay" onClick={() => setMapOpen(true)}>
                  <span>🗺️ Ver mapa · {points.length} {points.length === 1 ? "punto" : "puntos"}</span>
                </button>
              )}
            </div>
            {points.length > 0 && (
              <ol className="blog-map-legend" aria-label="Puntos del mapa">
                {points.map(p => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={activeId === p.id ? "is-active" : undefined}
                      onClick={() => showPoint(p.id)}
                      onMouseEnter={() => setActiveId(p.id)}
                      onMouseLeave={() => setActiveId(null)}
                    >
                      <span className={`blog-legend-num${p.spot ? " is-rumbo" : ""}`}>{p.number}</span>
                      <span className="blog-legend-name">{p.emoji} {p.name}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </MapPanel>
        )}

        <div className="blog-post-body">
          <BlogBlocks
            slug={post.slug}
            blocks={post.blocks}
            points={pointsById}
            tracks={tracksById}
            spots={post.spots}
            activeId={activeId}
            onHoverPoint={setActiveId}
            onShowPoint={showPoint}
          />
          <div className="blog-end">
            <p>¿Te sirvió? Compartila con quien vaya con vos.</p>
            <div className="blog-end-actions">
              <SaveAllButton spotIds={spotIds} slug={post.slug} />
              <ShareButton name={post.title} />
              <a className="blog-chip-btn" href="https://www.instagram.com/rumbo.app/" target="_blank" rel="noopener noreferrer">Seguinos en Instagram ↗</a>
            </div>
          </div>
        </div>
      </article>

      {post.related.length > 0 && (
        <section className="blog-related">
          <h2 className="blog-h2">Seguí leyendo</h2>
          <div className="blog-grid">
            {post.related.map(p => <BlogCard key={p.slug} post={p} />)}
          </div>
        </section>
      )}

      {hasMap && !mapOpen && (
        <button type="button" className={`blog-map-fab${previewGone ? " is-visible" : ""}`} onClick={() => setMapOpen(true)}>
          🗺️ Ver mapa
        </button>
      )}
    </div>
  )
}
