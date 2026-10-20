"use client"

import { useEffect, useState } from "react"
import { CldImage } from "next-cloudinary"
import ImageGallery from "./ImageGallery"


const sharedProps = {
  fill: true,
  crop: "fill",
  gravity: "auto",
  className: "object-cover",
  quality: "auto",
  format: "auto",
}

// Solo la foto principal se carga con prioridad: es lo primero que se ve.
// Antes las cinco competían con ella (y con el resto de la página).
export const loadingFor = (index) => (index === 0 ? { priority: true } : { loading: "lazy" })

// Una versión mínima y borrosa de la foto (unos pocos KB): se ve mientras
// baja la de verdad, así la principal nunca es un hueco vacío.
export function blurUrl(publicId) {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_32,e_blur:300,q_30,f_auto/${publicId}`
}

// Si la principal tarda más que esto (o falla), las demás arrancan igual.
export const THUMBS_WAIT_MS = 2500

// Una foto de la galería: aparece cuando terminó de cargar (antes aparecía
// por tiempo, y la principal, que es la más pesada, quedaba última).
// deferred: todavía no se pide (las miniaturas esperan a la principal).
function Photo({ img, index, sizes, borderRadius = 14, name, onOpen, deferred = false, onLoaded, className = "", children }) {
  const [loaded, setLoaded] = useState(false)
  const done = () => { setLoaded(true); onLoaded?.() }
  return (
    <div
      style={{
        overflow: "hidden", borderRadius, position: "relative", cursor: "pointer", background: "#e6e1d8",
        ...(index === 0 ? { backgroundImage: `url("${blurUrl(img.cloudinary_public_id)}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
      }}
      className={`spot-photo img-zoom${loaded ? " is-loaded" : ""}${className ? ` ${className}` : ""}`}
      onClick={() => onOpen(index)}
    >
      {!deferred && (
        <CldImage
          src={img.cloudinary_public_id}
          sizes={sizes}
          alt={`${name} ${index + 1}`}
          onLoad={done}
          onError={done}
          {...sharedProps}
          {...loadingFor(index)}
        />
      )}
      {children}
    </div>
  )
}

// El tamaño en que se ve cada foto (para pedirla a Cloudinary del tamaño
// justo): en el celular la principal ocupa todo el ancho (antes se pedía de
// la mitad y se veía menos nítida).
const MAIN_SIZES = "(max-width: 640px) 100vw, 50vw"
const THUMB_SIZES = "(max-width: 640px) 50vw, 25vw"

function SpotImages({ images = [], name }) {
  const [galleryIndex, setGalleryIndex] = useState(null)
  // Las miniaturas se piden cuando terminó la principal (antes competían con
  // ella y llegaban antes: la principal aparecía última).
  const [mainReady, setMainReady] = useState(false)
  useEffect(() => {
    if (mainReady) return
    const t = setTimeout(() => setMainReady(true), THUMBS_WAIT_MS)
    return () => clearTimeout(t)
  }, [mainReady])

  const count = images.length
  if (count === 0) return null

  const open = (i) => setGalleryIndex(i)
  const close = () => setGalleryIndex(null)
  const photo = (img, index, sizes, borderRadius, extra = {}) => (
    <Photo
      key={index} img={img} index={index} sizes={sizes} borderRadius={borderRadius} name={name} onOpen={open}
      deferred={index > 0 && !mainReady}
      onLoaded={index === 0 ? () => setMainReady(true) : undefined}
      {...extra}
    />
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
        .spot-photo img { opacity: 0; transition: opacity 0.35s ease; }
        .spot-photo.is-loaded img { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .spot-photo img { transition: none; } }
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

      {count === 1 && photo(images[0], 0, "100vw", 18, { className: "spot-img-single" })}

      {count === 2 && (
        <div className="spot-img-grid-2">
          {images.map((img, i) => photo(img, i, MAIN_SIZES, 18))}
        </div>
      )}

      {count === 3 && (
        <div className="spot-img-grid-3">
          {photo(images[0], 0, MAIN_SIZES, 18)}
          <div className="spot-img-sub-3">
            {images.slice(1).map((img, i) => photo(img, i + 1, THUMB_SIZES, 12))}
          </div>
        </div>
      )}

      {count === 4 && (
        <div className="spot-img-grid-4">
          {images.map((img, i) => photo(img, i, "(max-width: 640px) 50vw, 25vw", i === 0 ? 18 : 12))}
        </div>
      )}

      {count >= 5 && (
        <div className="spot-img-grid-5">
          {photo(images[0], 0, MAIN_SIZES, 18)}
          <div className="spot-img-sub-5">
            {images.slice(1, 5).map((img, i) => {
              const extra = images.length - 5
              const showOverlay = i === 3 && extra > 0
              return photo(img, i + 1, THUMB_SIZES, 12, {
                children: showOverlay ? (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, zIndex: 1 }}>
                    <span style={{ color: "#fff", fontSize: 26, fontWeight: 700, fontFamily: "var(--font-dm-sans), sans-serif", letterSpacing: "-0.02em" }}>
                      +{extra}
                    </span>
                  </div>
                ) : null,
              })
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