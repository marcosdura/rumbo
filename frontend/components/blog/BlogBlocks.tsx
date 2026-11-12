"use client"

// Los bloques de una nota, en orden (lib/blog.ts BlogBlock). Los puntos y
// los recorridos vienen del mapa de la nota: un bloque "point" es la parte
// del texto que habla de ese punto, con su número y "Ver en el mapa".
import Link from "next/link"
import { useState } from "react"
import SpotCard from "@/components/spots/SpotCard"
import PhotoLightbox from "@/components/spot-detail/PhotoLightbox"
import { gpxFileName, toGpx } from "@/lib/gpx"
import { pointAnchor, trackStats, type BlogBlock, type BlogSpot, type BlogTrack, type ResolvedPoint } from "@/lib/blog"
import BlogImage, { cloudinaryUrl } from "./BlogImage"
import Checklist from "./Checklist"
import RichText from "./RichText"
import VideoCard from "./VideoCard"

type Props = {
  slug: string
  blocks: BlogBlock[]
  points: Map<string, ResolvedPoint>
  tracks: Map<string, BlogTrack>
  spots: Record<string, BlogSpot>
  activeId: string | null
  onHoverPoint: (id: string | null) => void
  onShowPoint: (id: string) => void
}

function PointSection({ point, text, active, onHover, onShow }: {
  point: ResolvedPoint; text: string | null; active: boolean
  onHover: (id: string | null) => void; onShow: (id: string) => void
}) {
  const where = point.spot?.department
  const onMap = point.lat != null && point.lng != null
  return (
    <section
      id={pointAnchor(point.id)}
      className={`blog-point${active ? " is-active" : ""}`}
      onMouseEnter={() => onHover(point.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="blog-point-head">
        <span className={`blog-point-num${point.spot ? " is-rumbo" : ""}`}>{point.number}</span>
        <div className="blog-point-title">
          <h3>{point.name}</h3>
          <p>{point.emoji} {point.kind}{where ? ` · ${where}` : ""}{point.spot ? " · en Rumbo" : ""}</p>
        </div>
      </div>
      {point.note && <p className="blog-point-note">{point.note}</p>}
      {point.image && (
        <div className="blog-point-photo">
          <BlogImage id={point.image} alt={point.name} width={900} height={500} sizes="(max-width: 768px) 100vw, 640px" />
        </div>
      )}
      {text && <RichText text={text} />}
      <div className="blog-point-actions">
        {onMap && (
          <button type="button" className="blog-chip-btn" onClick={() => onShow(point.id)}>📍 Ver en el mapa</button>
        )}
        {point.href && <Link className="blog-chip-btn is-primary" href={point.href}>Ver en Rumbo →</Link>}
        {point.url && <a className="blog-chip-btn" href={point.url} target="_blank" rel="noopener noreferrer">Más info ↗</a>}
      </div>
    </section>
  )
}

function Gallery({ images, title }: { images: { image: string; caption: string | null }[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <figure className="blog-gallery">
      <div className="blog-gallery-row">
        {images.map((img, i) => (
          <button key={i} type="button" className="blog-gallery-item" onClick={() => setOpen(i)} aria-label={`Ver foto ${i + 1} de ${images.length}`}>
            <BlogImage id={img.image} alt={img.caption ?? `${title} ${i + 1}`} width={600} height={450} sizes="(max-width: 768px) 80vw, 240px" />
            {img.caption && <span className="blog-gallery-caption">{img.caption}</span>}
          </button>
        ))}
      </div>
      {open != null && (
        <PhotoLightbox photos={images.map(img => cloudinaryUrl(img.image))} name={title} startIndex={open} onClose={() => setOpen(null)} />
      )}
    </figure>
  )
}

function GpxCard({ track, slug }: { track: BlogTrack; slug: string }) {
  function download() {
    const blob = new Blob([toGpx(track.name, track.points)], { type: "application/gpx+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = gpxFileName(`${slug}-${track.id}`, track.name)
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="blog-gpx">
      <div>
        <p className="blog-gpx-label">Recorrido</p>
        <p className="blog-gpx-name">{track.name}</p>
        <p className="blog-gpx-stats">{trackStats(track).join(" · ")}</p>
      </div>
      <button type="button" className="blog-chip-btn is-primary" onClick={download}>⬇ Descargar GPX</button>
    </div>
  )
}

export default function BlogBlocks({ slug, blocks, points, tracks, spots, activeId, onHoverPoint, onShowPoint }: Props) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 2
              ? <h2 key={i} className="blog-h2">{block.text}</h2>
              : <h3 key={i} className="blog-h3">{block.text}</h3>
          case "text":
            return <RichText key={i} text={block.text} />
          case "image":
            return (
              <figure key={i} className="blog-figure">
                <div className="blog-figure-img">
                  <BlogImage id={block.image} alt={block.alt ?? block.caption ?? ""} width={1200} height={800} sizes="(max-width: 768px) 100vw, 680px" />
                </div>
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            )
          case "gallery":
            return <Gallery key={i} images={block.images} title={slug} />
          case "point": {
            const point = points.get(block.point)
            return point
              ? <PointSection key={i} point={point} text={block.text} active={activeId === point.id} onHover={onHoverPoint} onShow={onShowPoint} />
              : null
          }
          case "spot": {
            const spot = spots[String(block.spot_id)]
            return spot ? <div key={i} className="blog-spot-card"><SpotCard spot={spot} /></div> : null
          }
          case "tip":
            return (
              <aside key={i} className={`blog-tip is-${block.tone}`}>
                <p className="blog-tip-title">{block.tone === "warning" ? "⚠️" : "💡"} {block.title ?? (block.tone === "warning" ? "Atención" : "Consejo")}</p>
                <RichText text={block.text} />
              </aside>
            )
          case "checklist":
            return <Checklist key={i} storageKey={`rumbo-blog:${slug}:${i}`} title={block.title} items={block.items} />
          case "video": {
            // Los videos seguidos van juntos: en el celular se deslizan de costado.
            if (blocks[i - 1]?.type === "video") return null
            const run: Extract<BlogBlock, { type: "video" }>[] = []
            for (let j = i; j < blocks.length; j++) {
              const b = blocks[j]
              if (b.type !== "video") break
              run.push(b)
            }
            return (
              <div key={i} className="blog-videos">
                {run.map((v, j) => (
                  <VideoCard key={j} platform={v.platform} videoId={v.video_id} url={v.url} title={v.title} cover={v.cover} />
                ))}
              </div>
            )
          }
          case "gpx": {
            const track = tracks.get(block.track)
            return track ? <GpxCard key={i} track={track} slug={slug} /> : null
          }
          default:
            return null
        }
      })}
    </>
  )
}
