"use client"

// Un video de YouTube o un reel de Instagram: no se incrusta (la página no
// carga nada de terceros), es una tarjeta que lleva al video. YouTube da la
// miniatura sola; Instagram no, así que se usa la portada que se haya subido
// o una tarjeta con sus colores.
import { useState } from "react"
import BlogImage from "./BlogImage"
import { youtubeThumbnail } from "@/lib/blog"

type Props = {
  platform: "youtube" | "instagram"
  videoId: string
  url: string
  title: string
  cover: string | null
}

export default function VideoCard({ platform, videoId, url, title, cover }: Props) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const isYoutube = platform === "youtube"
  const source = isYoutube ? "YouTube" : "Instagram"
  const action = isYoutube ? "Ver en YouTube" : "Ver reel en Instagram"

  let picture
  if (cover) {
    picture = <BlogImage id={cover} alt="" width={720} height={isYoutube ? 405 : 900} sizes="(max-width: 768px) 100vw, 360px" />
  } else if (isYoutube && !thumbFailed) {
    picture = (
      // eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube, fuera de Cloudinary
      <img src={youtubeThumbnail(videoId)} alt="" loading="lazy" onError={() => setThumbFailed(true)} />
    )
  } else {
    picture = <div className={`blog-video-fallback is-${platform}`} aria-hidden="true">{isYoutube ? "▶" : "◎"}</div>
  }

  return (
    <a className={`blog-video is-${platform}`} href={url} target="_blank" rel="noopener noreferrer">
      <div className="blog-video-thumb">
        {picture}
        <span className="blog-video-play" aria-hidden="true">▶</span>
      </div>
      <div className="blog-video-body">
        <span className="blog-video-source">{source}</span>
        <span className="blog-video-title">{title}</span>
        <span className="blog-video-action">{action} ↗</span>
      </div>
    </a>
  )
}
