"use client"

// En el editor, para una nota publicada: los links para Instagram (con utm,
// uno por lugar donde se pega) y la imagen para una historia.
import { useState } from "react"
import { INSTAGRAM_PLACES, instagramLink, storyImagePath, type InstagramPlace } from "@/lib/blogShare"

export default function InstagramPanel({ slug }: { slug: string }) {
  const [copied, setCopied] = useState<InstagramPlace | null>(null)

  async function copy(place: InstagramPlace) {
    try {
      await navigator.clipboard.writeText(instagramLink(`/blog/${slug}`, place, slug))
      setCopied(place)
      setTimeout(() => setCopied(c => (c === place ? null : c)), 2000)
    } catch {
      // Sin permiso para el portapapeles: el link se ve en el campo.
    }
  }

  return (
    <section className="be-card be-instagram">
      <h2 className="be-h2">Llevarla a Instagram</h2>
      <div className="be-instagram-grid">
        <div className="be-instagram-story">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={storyImagePath(slug)} alt="La imagen para la historia" loading="lazy" width={180} height={320} />
          <a className="be-btn is-primary" href={`${storyImagePath(slug)}?descargar=1`} download={`rumbo-historia-${slug}.png`}>
            ⬇ Imagen para historia
          </a>
        </div>
        <div className="be-instagram-links">
          <p className="be-hint">
            Cada link dice de dónde vino la visita (en Google Analytics: Adquisición › Campañas,
            con <code>{slug}</code> como campaña). Usá el que corresponde a dónde lo pegás.
          </p>
          {INSTAGRAM_PLACES.map(({ place, label }) => {
            const url = instagramLink(`/blog/${slug}`, place, slug)
            return (
              <div key={place} className="be-field">
                <span>{label}</span>
                <div className="be-inline">
                  <input className="be-input" value={url} readOnly aria-label={`Link para ${label}`} onFocus={e => e.target.select()} />
                  <button type="button" className="be-btn" onClick={() => copy(place)}>{copied === place ? "✓ Copiado" : "Copiar"}</button>
                </div>
              </div>
            )
          })}
          <p className="be-hint">
            Para la bio de Instagram, mejor <a href="/links" target="_blank" rel="noreferrer">rumboapp.uy/links</a>: muestra
            siempre la última guía y no hay que cambiarlo con cada nota.
          </p>
        </div>
      </div>
    </section>
  )
}
