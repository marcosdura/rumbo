"use client"

// Una nota del blog, armada como la página de un lugar o de una ruta: todo
// en una columna que se baja. Arriba el título, con "Guardar" y "Compartir"
// en el mismo renglón (en el celular, solo los íconos, al lado de volver);
// después la tapa, el mapa en su tarjeta (como "Ubicación" en el lugar) y el
// texto. "Ver en el mapa" en un punto sube hasta el mapa y lo muestra.
import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useMemo, useRef, useState } from "react"
import ShareButton from "@/components/ui/ShareButton"
import {
  categoryLabel, publishedLabel, readingLabel, resolvePoints, type BlogPostData,
} from "@/lib/blog"
import BlogBlocks from "./BlogBlocks"
import BlogCard from "./BlogCard"
import BlogImage from "./BlogImage"
import SaveGuideButton from "./SaveGuideButton"
import "./blog.css"

const BlogMap = dynamic(() => import("./BlogMap"), {
  ssr: false,
  loading: () => <div className="blog-map-loading">Cargando mapa…</div>,
})

// El subtítulo con el puntito verde de las secciones de Rumbo ("Ubicación",
// "Ruta de trekking").
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="blog-eyebrow">
      <span className="blog-eyebrow-dot" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

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

  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ id: string; at: number } | null>(null)
  const mapRef = useRef<HTMLElement>(null)

  // Desde el texto: sube hasta el mapa, lo centra en el punto y abre su globo.
  const showPoint = useCallback((id: string) => {
    setSelected({ id, at: Date.now() })
    mapRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" })
  }, [])
  const pickFromMap = useCallback((id: string) => setActiveId(id), [])

  const date = publishedLabel(post.published_at)
  const category = categoryLabel(post.category)

  return (
    <div className="blog-page">
      <article className="blog-post">
        <header className="blog-post-header">
          {/* Como en el lugar: volver y, en el celular, guardar y compartir al lado. */}
          <div className="blog-top-bar">
            <Link href="/blog" className="blog-back">← Blog</Link>
            <div className="blog-mobile-actions">
              <SaveGuideButton post={post} icon />
              <ShareButton name={post.title} icon />
            </div>
          </div>

          <Eyebrow>
            <Link href={`/blog?categoria=${post.category}`}>{category}</Link>
            {post.region && <> · {post.region}</>}
          </Eyebrow>
          <div className="blog-title-row">
            <h1 className="blog-title">{post.title}</h1>
            <div className="blog-actions">
              <SaveGuideButton post={post} />
              <ShareButton name={post.title} />
            </div>
          </div>
          {post.summary && <p className="blog-summary">{post.summary}</p>}
          <p className="blog-meta">{[date, readingLabel(post.reading_minutes)].filter(Boolean).join(" · ")}</p>
          {post.cover_image && (
            <div className="blog-cover">
              <BlogImage id={post.cover_image} alt={post.title} width={1400} height={800} sizes="(max-width: 768px) 100vw, 760px" priority />
            </div>
          )}
        </header>

        {hasMap && (
          <section ref={mapRef} className="blog-section-card blog-map-card" aria-label={`Mapa de ${post.title}`}>
            <Eyebrow>Mapa de la guía · {points.length} {points.length === 1 ? "punto" : "puntos"}</Eyebrow>
            <div className="blog-map-box">
              <BlogMap
                points={points}
                tracks={tracks}
                activeId={activeId}
                selected={selected}
                sectionIds={sectionIds}
                onPick={pickFromMap}
              />
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
          </section>
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
            <p>¿Te sirvió? Guardala o compartila con quien vaya con vos.</p>
            <div className="blog-end-actions">
              <SaveGuideButton post={post} />
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
    </div>
  )
}
