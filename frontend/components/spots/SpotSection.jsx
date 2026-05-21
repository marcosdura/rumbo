"use client"
import { useState } from "react"
import Link from "next/link"
import SpotList from "@/components/spots/SpotList"
import Pill from "@/components/ui/Pill"
import CircleArrow from "@/components/ui/CircleArrow"

export default function SpotSection({ label, title, count, spots, loading, href }) {
  const [hovered, setHovered] = useState(false)

  const titleRow = (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 12,
        cursor: href ? "pointer" : "default",
      }}
      onMouseEnter={() => href && setHovered(true)}
      onMouseLeave={() => href && setHovered(false)}
    >
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 30, fontWeight: 600,
        color: hovered ? "#2d6a4f" : "#1b1b19",
        margin: 0, lineHeight: 1.2,
        transition: "color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        {title}
      </h2>
      {href && <CircleArrow active={hovered} />}
    </div>
  )

  return (
    <section style={{ paddingTop: 24, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
            {label}
          </p>
        </div>

        {href
          ? <Link href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{titleRow}</Link>
          : titleRow
        }
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#e0ddd6", marginBottom: 12 }} />

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              height: 180, borderRadius: 20,
              background: "#ede9e1",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          <SpotList spots={spots} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  )
}