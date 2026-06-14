"use client"
import { useRef } from "react"

interface Props {
  imageUrl: string
  focalX?: number
  focalY?: number
  onChange: (x: number, y: number) => void
}

const CARD_ASPECT = 600 / 160

export default function FocalPointPicker({ imageUrl, focalX = 0.5, focalY = 0.5, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    onChange(x, y)
  }

  return (
    <div>
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{
          position: "relative",
          width: "100%",
          height: 220,
          borderRadius: 12,
          overflow: "hidden",
          cursor: "crosshair",
          border: "2px solid #2d6a4f",
          userSelect: "none",
        }}
      >
        <img
          src={imageUrl}
          alt="focal"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focalX * 100}% ${focalY * 100}%`,
            display: "block",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
        }} />

        {(() => {
          const windowTop = `${focalY * 100}%`
          return (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: windowTop,
                transform: "translateY(-50%)",
                maxHeight: "100%",
              }}
            >
              <div style={{
                width: "100%",
                aspectRatio: `${CARD_ASPECT}`,
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 0 0 2px #fff, 0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <img
                  src={imageUrl}
                  alt="crop preview"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${focalX * 100}% ${focalY * 100}%`,
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          )
        })()}

        <div style={{
          position: "absolute",
          left: `${focalX * 100}%`,
          top: `${focalY * 100}%`,
          transform: "translate(-50%, -50%)",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          border: "3px solid #2d6a4f",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          pointerEvents: "none",
          zIndex: 10,
        }} />

        <div style={{
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          fontSize: 11,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          pointerEvents: "none",
          zIndex: 10,
        }}>
          Hacé click para ajustar el encuadre
        </div>
      </div>
    </div>
  )
}
