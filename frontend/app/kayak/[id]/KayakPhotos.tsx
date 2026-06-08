"use client"

import { useState } from "react"
import KayakImageGallery from "@/components/spot-detail/KayakImageGallery"

export default function KayakPhotos({ photos, name }: { photos: string[]; name: string }) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

  if (!photos.length) return null

  const open = (i: number) => setGalleryIndex(i)
  const close = () => setGalleryIndex(null)

  return (
    <>
      <style>{`
        .kayak-photo-grid-1 { height: 340px; border-radius: 18px; overflow: hidden; cursor: pointer; }
        .kayak-photo-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; }
        .kayak-photo-grid-3 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; }
        .kayak-photo-sub { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; }
        .kayak-photo-item { overflow: hidden; border-radius: 14px; cursor: pointer; }
        .kayak-photo-item img, .kayak-photo-grid-1 img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .kayak-photo-item:hover img, .kayak-photo-grid-1:hover img { transform: scale(1.04); }

        @media (max-width: 560px) {
          .kayak-photo-grid-2, .kayak-photo-grid-3 { grid-template-columns: 1fr; height: auto; }
          .kayak-photo-grid-2 .kayak-photo-item,
          .kayak-photo-grid-3 .kayak-photo-item { height: 220px; }
          .kayak-photo-sub { grid-template-rows: unset; grid-template-columns: 1fr 1fr; }
          .kayak-photo-sub .kayak-photo-item { height: 140px; }
        }
      `}</style>

      {photos.length === 1 && (
        <div className="kayak-photo-grid-1" onClick={() => open(0)}>
          <img src={photos[0]} alt={name} />
        </div>
      )}

      {photos.length === 2 && (
        <div className="kayak-photo-grid-2">
          {photos.map((src, i) => (
            <div key={i} className="kayak-photo-item" onClick={() => open(i)}>
              <img src={src} alt={`${name} ${i + 1}`} />
            </div>
          ))}
        </div>
      )}

      {photos.length >= 3 && (
        <div className="kayak-photo-grid-3">
          <div className="kayak-photo-item" onClick={() => open(0)}>
            <img src={photos[0]} alt={name} />
          </div>
          <div className="kayak-photo-sub">
            {photos.slice(1, 3).map((src, i) => (
              <div key={i} className="kayak-photo-item" onClick={() => open(i + 1)}>
                <img src={src} alt={`${name} ${i + 2}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {galleryIndex !== null && (
        <KayakImageGallery photos={photos} name={name} startIndex={galleryIndex} onClose={close} />
      )}
    </>
  )
}
