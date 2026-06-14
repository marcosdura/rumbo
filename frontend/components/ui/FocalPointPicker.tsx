"use client"
import { useRef } from "react"

interface Props {
  imageUrl: string
  focalX?: number
  focalY?: number
  onChange: (x: number, y: number) => void
}

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
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: "relative",
        width: "100%",
        height: 180,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "crosshair",
        border: "2px solid #2d6a4f",
      }}
    >
      <img
        src={imageUrl}
        alt="focal point"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
      }} />
      <div style={{
        position: "absolute",
        left: `${focalX * 100}%`,
        top: `${focalY * 100}%`,
        transform: "translate(-50%, -50%)",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#fff",
        border: "3px solid #2d6a4f",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        pointerEvents: "none",
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
        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        pointerEvents: "none",
      }}>
        Hacé click para ajustar el punto focal
      </div>
    </div>
  )
}
