"use client"

import { useState } from "react"
import PhotoLightbox from "@/components/spot-detail/PhotoLightbox"
import CloudinaryPhoto from "@/components/spot-detail/CloudinaryPhoto"

// Fotos de una escuela de surf o un servicio de kayak (URL completa de
// Cloudinary, ver CloudinaryPhoto), con galería al tocar.
export default function OperatorPhotos({ photos, name }: { photos: string[]; name: string }) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

  if (!photos.length) return null

  const open = (i: number) => setGalleryIndex(i)
  const close = () => setGalleryIndex(null)

  return (
    <>
      <style>{`
        .op-photo-grid-1 { height: 340px; border-radius: 18px; overflow: hidden; cursor: pointer; position: relative; }
        .op-photo-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; }
        .op-photo-grid-3 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; }
        .op-photo-sub { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; }
        .op-photo-item { overflow: hidden; border-radius: 14px; cursor: pointer; position: relative; }
        .op-photo-item img, .op-photo-grid-1 img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .op-photo-item:hover img, .op-photo-grid-1:hover img { transform: scale(1.04); }

        @media (max-width: 560px) {
          .op-photo-grid-2, .op-photo-grid-3 { grid-template-columns: 1fr; height: auto; }
          .op-photo-grid-2 .op-photo-item,
          .op-photo-grid-3 .op-photo-item { height: 220px; }
          .op-photo-sub { grid-template-rows: unset; grid-template-columns: 1fr 1fr; }
          .op-photo-sub .op-photo-item { height: 140px; }
        }
      `}</style>

      {photos.length === 1 && (
        <div className="op-photo-grid-1" onClick={() => open(0)}>
          <CloudinaryPhoto src={photos[0]} alt={name} />
        </div>
      )}

      {photos.length === 2 && (
        <div className="op-photo-grid-2">
          {photos.map((src, i) => (
            <div key={i} className="op-photo-item" onClick={() => open(i)}>
              <CloudinaryPhoto src={src} alt={`${name} ${i + 1}`} />
            </div>
          ))}
        </div>
      )}

      {photos.length >= 3 && (
        <div className="op-photo-grid-3">
          <div className="op-photo-item" onClick={() => open(0)}>
            <CloudinaryPhoto src={photos[0]} alt={name} />
          </div>
          <div className="op-photo-sub">
            {photos.slice(1, 3).map((src, i) => (
              <div key={i} className="op-photo-item" onClick={() => open(i + 1)}>
                <CloudinaryPhoto src={src} alt={`${name} ${i + 2}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {galleryIndex !== null && (
        <PhotoLightbox photos={photos} name={name} startIndex={galleryIndex} onClose={close} />
      )}
    </>
  )
}
