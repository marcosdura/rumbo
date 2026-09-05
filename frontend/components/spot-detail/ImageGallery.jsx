"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { CldImage } from "next-cloudinary"
import { useModalA11y } from "@/lib/useModalA11y"

function ImageGallery({ images, name, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  // Escape, focus trap, restauración de foco y scroll lock salen del hook.
  const panelRef = useModalA11y(true, onClose)

  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + images.length) % images.length), [images.length])

  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % images.length), [images.length])

  // Las flechas sí son propias de la galería.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [prev, next])

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${name}`}
      tabIndex={-1}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          color: "#fff",
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        ✕
      </button>

      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
        {current + 1} / {images.length}
      </p>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "min(90vw, 1100px)",
          height: "min(76vh, 720px)",
          borderRadius: 12,
        }}
      >
        <CldImage
          key={current}
          src={images[current].cloudinary_public_id}
          alt={`${name} ${current + 1}`}
          fill
          crop="limit"
          quality="auto"
          format="auto"
          className="object-contain"
          sizes="(max-width: 1100px) 90vw, 1100px"
          priority
        />
      </div>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev() }} style={arrowStyle("left")}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); next() }} style={arrowStyle("right")}>›</button>
        </>
      )}

      {images.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            maxWidth: "min(90vw, 960px)",
            paddingBottom: 4,
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                flexShrink: 0,
                position: "relative",
                width: 72,
                height: 52,
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                border: i === current ? "2px solid #fff" : "2px solid transparent",
                opacity: i === current ? 1 : 0.5,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              <CldImage
                src={img.cloudinary_public_id}
                alt={`${name} ${i + 1}`}
                fill
                crop="fill"
                gravity="auto"
                quality="40"
                format="auto"
                className="object-cover"
                sizes="72px"
              />
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}

const arrowStyle = (side) => ({
  position: "absolute",
  top: "50%",
  [side]: 16,
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.1)",
  border: "none",
  borderRadius: "50%",
  width: 48,
  height: 48,
  color: "#fff",
  fontSize: 32,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
})

export default ImageGallery