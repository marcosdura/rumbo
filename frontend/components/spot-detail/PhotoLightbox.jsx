"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"

export default function PhotoLightbox({ photos, name, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex)

  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + photos.length) % photos.length), [photos.length])

  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % photos.length), [photos.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 40, height: 40, color: "#fff", fontSize: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>

      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)" }}>
        {current + 1} / {photos.length}
      </p>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(90vw, 960px)", height: "min(70vh, 640px)", borderRadius: 12, overflow: "hidden" }}
      >
        <img
          key={current}
          src={photos[current]}
          alt={`${name} ${current + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev() }} style={arrowStyle("left")}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); next() }} style={arrowStyle("right")}>›</button>
        </>
      )}

      {photos.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "min(90vw, 960px)", paddingBottom: 4 }}
        >
          {photos.map((src, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                flexShrink: 0, width: 72, height: 52, borderRadius: 8, overflow: "hidden", cursor: "pointer",
                border: i === current ? "2px solid #fff" : "2px solid transparent",
                opacity: i === current ? 1 : 0.5,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              <img src={src} alt={`${name} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}

const arrowStyle = (side) => ({
  position: "absolute", top: "50%", [side]: 16, transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
  width: 48, height: 48, color: "#fff", fontSize: 32, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
})
