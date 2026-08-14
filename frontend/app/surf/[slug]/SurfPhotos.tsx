"use client"

import { useState } from "react"
import SurfImageGallery from "@/components/spot-detail/SurfImageGallery"

export default function SurfPhotos({ photos, name }: { photos: string[]; name: string }) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

  if (!photos.length) return null

  const open = (i: number) => setGalleryIndex(i)
  const close = () => setGalleryIndex(null)

  const itemStyle = (borderRadius = 14): React.CSSProperties => ({
    overflow: "hidden",
    borderRadius,
    cursor: "pointer",
    position: "relative",
  })

  return (
    <>
      <style>{`
        .surf-photo-grid-1 { height: 340px; border-radius: 18px; overflow: hidden; cursor: pointer; }
        .surf-photo-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; }
        .surf-photo-grid-3 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; }
        .surf-photo-sub { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; }
        .surf-photo-item { overflow: hidden; border-radius: 14px; cursor: pointer; }
        .surf-photo-item img, .surf-photo-grid-1 img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .surf-photo-item:hover img, .surf-photo-grid-1:hover img { transform: scale(1.04); }

        @media (max-width: 560px) {
          .surf-photo-grid-2, .surf-photo-grid-3 { grid-template-columns: 1fr; height: auto; }
          .surf-photo-grid-2 .surf-photo-item,
          .surf-photo-grid-3 .surf-photo-item { height: 220px; }
          .surf-photo-sub { grid-template-rows: unset; grid-template-columns: 1fr 1fr; }
          .surf-photo-sub .surf-photo-item { height: 140px; }
        }
      `}</style>

      {photos.length === 1 && (
        <div className="surf-photo-grid-1" onClick={() => open(0)}>
          <img src={photos[0]} alt={name} />
        </div>
      )}

      {photos.length === 2 && (
        <div className="surf-photo-grid-2">
          {photos.map((src, i) => (
            <div key={i} className="surf-photo-item" onClick={() => open(i)}>
              <img src={src} alt={`${name} ${i + 1}`} />
            </div>
          ))}
        </div>
      )}

      {photos.length >= 3 && (
        <div className="surf-photo-grid-3">
          <div className="surf-photo-item" onClick={() => open(0)}>
            <img src={photos[0]} alt={name} />
          </div>
          <div className="surf-photo-sub">
            {photos.slice(1, 3).map((src, i) => (
              <div key={i} className="surf-photo-item" onClick={() => open(i + 1)}>
                <img src={src} alt={`${name} ${i + 2}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {galleryIndex !== null && (
        <SurfImageGallery photos={photos} name={name} startIndex={galleryIndex} onClose={close} />
      )}
    </>
  )
}
