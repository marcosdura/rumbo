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
      {count === 1 && (
        <div style={{ height: 350, ...wrapStyle(18) }} onClick={() => open(0)} className="img-reveal img-zoom">
          <CldImage src={images[0].cloudinary_public_id} sizes="100vw" alt={name} {...sharedProps} />
        </div>
      )}

      {count === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: 350 }}>
          {images.map((img, i) => <Img key={i} img={img} index={i} sizes="50vw" borderRadius={18} />)}
        </div>
      )}

      {count === 3 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: 350 }}>
          <Img img={images[0]} index={0} sizes="50vw" borderRadius={18} />
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 8 }}>
            {images.slice(1).map((img, i) => <Img key={i} img={img} index={i + 1} sizes="25vw" borderRadius={12} />)}
          </div>
        </div>
      )}

      {count === 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, height: 350 }}>
          {images.map((img, i) => <Img key={i} img={img} index={i} sizes="50vw" borderRadius={i === 0 ? 18 : 12} />)}
        </div>
      )}

      {count >= 5 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: 350 }}>
          <Img img={images[0]} index={0} sizes="50vw" borderRadius={18} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 }}>
            {images.slice(1, 5).map((img, i) => <Img key={i} img={img} index={i + 1} sizes="25vw" borderRadius={12} />)}
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