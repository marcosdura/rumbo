"use client"

import { useState } from "react"
import { CldImage } from "next-cloudinary"
import ImageGallery from "./ImageGallery"


function SpotImages({ images = [], name }) {
  const [galleryIndex, setGalleryIndex] = useState(null)

  const count = images.length
  if (count === 0) return null

  const open = (i) => setGalleryIndex(i)
  const close = () => setGalleryIndex(null)

  const sharedProps = {
    fill: true,
    crop: "fill",
    gravity: "auto",
    loading: "eager",
    className: "object-cover",
    quality: "auto",
    format: "auto",
    priority: true,
  }

  const wrapStyle = (borderRadius = 14, index = 0) => ({
    overflow: "hidden",
    borderRadius,
    position: "relative",
    cursor: "pointer",
  })

  const Img = ({ img, index, sizes, borderRadius = 14 }) => (
    <div
      style={wrapStyle(borderRadius, index)}
      className="img-reveal img-zoom"
      onClick={() => open(index)}
    >
      <CldImage
        src={img.cloudinary_public_id}
        sizes={sizes}
        alt={`${name} ${index + 1}`}
        {...sharedProps}
      />
    </div>
  )

  return (
    <>
      <style>{`
        .spot-img-single { height: 350px; }
        .spot-img-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: 350px; }
        .spot-img-grid-3 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: 350px; }
        .spot-img-grid-4 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; height: 350px; }
        .spot-img-grid-5 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: 350px; }
        .spot-img-sub-3 { display: grid; grid-template-rows: 1fr 1fr; gap: 8px; }
        .spot-img-sub-5 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; }
        @media (max-width: 640px) {
          .spot-img-single { height: 240px; }
          .spot-img-grid-2 { grid-template-columns: 1fr; height: auto; gap: 8px; }
          .spot-img-grid-2 > * { height: 200px; }
          .spot-img-grid-3 { grid-template-columns: 1fr; height: auto; gap: 8px; }
          .spot-img-grid-3 > * { height: 180px; }
          .spot-img-sub-3 { grid-template-rows: unset; grid-template-columns: 1fr 1fr; }
          .spot-img-grid-4 { grid-template-columns: 1fr 1fr; height: 280px; }
          .spot-img-grid-5 { grid-template-columns: 1fr; height: auto; gap: 8px; }
          .spot-img-grid-5 > *:first-child { height: 220px; }
          .spot-img-sub-5 { grid-template-columns: 1fr 1fr; grid-template-rows: unset; height: 140px; }
        }
      `}</style>

      {count === 1 && (
        <div className="spot-img-single img-reveal img-zoom" style={wrapStyle(18)} onClick={() => open(0)}>
          <CldImage src={images[0].cloudinary_public_id} sizes="100vw" alt={name} {...sharedProps} />
        </div>
      )}

      {count === 2 && (
        <div className="spot-img-grid-2">
          {images.map((img, i) => <Img key={i} img={img} index={i} sizes="50vw" borderRadius={18} />)}
        </div>
      )}

      {count === 3 && (
        <div className="spot-img-grid-3">
          <Img img={images[0]} index={0} sizes="50vw" borderRadius={18} />
          <div className="spot-img-sub-3">
            {images.slice(1).map((img, i) => <Img key={i} img={img} index={i + 1} sizes="25vw" borderRadius={12} />)}
          </div>
        </div>
      )}

      {count === 4 && (
        <div className="spot-img-grid-4">
          {images.map((img, i) => <Img key={i} img={img} index={i} sizes="50vw" borderRadius={i === 0 ? 18 : 12} />)}
        </div>
      )}

      {count >= 5 && (
        <div className="spot-img-grid-5">
          <Img img={images[0]} index={0} sizes="50vw" borderRadius={18} />
          <div className="spot-img-sub-5">
            {images.slice(1, 5).map((img, i) => {
              const isLast = i === 3
              const extra = images.length - 5
              const showOverlay = isLast && extra > 0

              return (
                <div
                  key={i}
                  style={{ position: "relative", overflow: "hidden", borderRadius: 12, cursor: "pointer" }}
                  className="img-reveal img-zoom"
                  onClick={() => open(i + 1)}
                >
                  <CldImage
                    src={img.cloudinary_public_id}
                    sizes="25vw"
                    alt={`${name} ${i + 2}`}
                    {...sharedProps}
                  />
                  {showOverlay && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                    }}>
                      <span style={{
                        color: "#fff",
                        fontSize: 26,
                        fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: "-0.02em",
                      }}>
                        +{extra}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {galleryIndex !== null && (
        <ImageGallery
          images={images}
          name={name}
          startIndex={galleryIndex}
          onClose={close}
        />
      )}
    </>
  )
}

export default SpotImages