"use client"

import { CldImage } from 'next-cloudinary'

function SpotImages({ images = [], name }) {
  const count = images.length
  if (count === 0) return null

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

  const wrapStyle = (borderRadius = 14) => ({
    overflow: "hidden",
    borderRadius,
    position: "relative",
  })

  // 1 imagen
  if (count === 1) {
    return (
      <div style={{ height: 350 , ...wrapStyle(18) }} className="img-reveal img-zoom">
        <CldImage src={images[0].cloudinary_public_id} sizes="100vw" alt={name} {...sharedProps} />
      </div>
    )
  }

  // 2 imágenes
  if (count === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: 350  }}>
        {images.map((img, i) => (
          <div key={i} style={wrapStyle(18)} className="img-reveal img-zoom">
            <CldImage src={img.cloudinary_public_id} sizes="50vw" alt={`${name} ${i + 1}`} {...sharedProps} />
          </div>
        ))}
      </div>
    )
  }

  // 3 imágenes
  if (count === 3) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: 350  }}>
        <div style={wrapStyle(18)} className="img-reveal img-zoom">
          <CldImage src={images[0].cloudinary_public_id} sizes="50vw" alt={name} {...sharedProps} />
        </div>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 8 }}>
          {images.slice(1).map((img, i) => (
            <div key={i} style={wrapStyle(12)} className="img-reveal img-zoom">
              <CldImage src={img.cloudinary_public_id} sizes="25vw" alt={`${name} ${i + 2}`} {...sharedProps} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4 imágenes
  if (count === 4) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, height: 350  }}>
        {images.map((img, i) => (
          <div key={i} style={wrapStyle(i === 0 ? 18 : 12)} className="img-reveal img-zoom">
            <CldImage src={img.cloudinary_public_id} sizes="50vw" alt={`${name} ${i + 1}`} {...sharedProps} />
          </div>
        ))}
      </div>
    )
  }

  // 5+ imágenes (layout original)
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: 350  }}>
      <div style={wrapStyle(18)} className="img-reveal img-zoom">
        <CldImage src={images[0].cloudinary_public_id} sizes="50vw" alt={name} {...sharedProps} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 }}>
        {images.slice(1, 5).map((img, i) => (
          <div key={i} style={wrapStyle(12)} className="img-reveal img-zoom">
            <CldImage src={img.cloudinary_public_id} sizes="25vw" alt={`${name} ${i + 2}`} {...sharedProps} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SpotImages