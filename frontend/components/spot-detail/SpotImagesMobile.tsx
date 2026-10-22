"use client"

// Las fotos del lugar en el celular: arriba de todo, a todo el ancho, una por
// vez y deslizando con el dedo (la principal primero), con "1/n" encima y
// guardar y compartir arriba a la derecha (actions). Al tocar una se abre en
// grande. En la compu se ven en grilla (SpotImages).
import { useRef, useState, type ReactNode } from "react"
import { CldImage } from "next-cloudinary"
import ImageGallery from "./ImageGallery"
import type { SpotPhoto } from "./SpotImages"

export default function SpotImagesMobile({ images = [], name, actions }: { images?: SpotPhoto[]; name: string; actions?: ReactNode }) {
  const [current, setCurrent] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  if (images.length === 0) return null

  // La foto que se ve es la que ocupa el ancho después de deslizar.
  function onScroll() {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    setCurrent(Math.min(images.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))))
  }

  return (
    <div className="spot-mobile-photos">
      <div ref={trackRef} className="spot-mobile-photos-track" onScroll={onScroll}>
        {images.map((img, i) => (
          <button
            key={img.cloudinary_public_id}
            type="button"
            className="spot-mobile-photo"
            onClick={() => setGalleryIndex(i)}
            aria-label={`Ver foto ${i + 1} de ${name}`}
          >
            <CldImage
              src={img.cloudinary_public_id}
              alt={`${name} ${i + 1}`}
              fill
              crop="fill"
              gravity="auto"
              quality="auto"
              format="auto"
              sizes="100vw"
              className="object-cover"
              {...(i === 0 ? { priority: true } : { loading: "lazy" as const })}
            />
          </button>
        ))}
      </div>
      {actions && <div className="spot-mobile-photos-actions">{actions}</div>}
      <span className="spot-mobile-photos-count" aria-live="polite">{current + 1}/{images.length}</span>
      {galleryIndex !== null && (
        <ImageGallery images={images} name={name} startIndex={galleryIndex} onClose={() => setGalleryIndex(null)} />
      )}
    </div>
  )
}
