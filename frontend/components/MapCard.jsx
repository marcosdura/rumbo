"use client"

import { useState } from "react"

function MapCard({ lat, lng, name }) {
  const [hovered, setHovered] = useState(false)
  const query = lat && lng ? `${lat},${lng}` : "-34.906,-56.164"
  const mapsUrl = `https://www.google.com/maps?q=${query}&output=embed`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0ddd6",
        borderRadius: 20,
        padding: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <h3 style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#2d6a4f", margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Ubicación
        </h3>
      </div>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          flex: 1,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #e0ddd6",
          minHeight: 180,
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: hovered ? "none" : "auto",
        }} />

        <iframe
          loading="lazy"
          width="100%"
          height="100%"
          style={{
            display: "block",
            height: "100%",
            minHeight: 180,
            transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
          src={mapsUrl}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}

export default MapCard