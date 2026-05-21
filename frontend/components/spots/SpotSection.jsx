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
      <h2 className="spot-section-title" style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 600,
        color: hovered ? "#2d6a4f" : "#1b1b19",
        margin: 0, lineHeight: 1.2,
        transition: "color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        {title}
      </h2>
      {count > 0 && (
        <Pill variant="dark-green" style={{ fontSize: 12, padding: "3px 12px", flexShrink: 0 }}>
          {count}
        </Pill>
      )}
      {href && <CircleArrow active={hovered} />}
    </div>
  )

  return (
    <section style={{ paddingTop: 24, fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        .spot-section-title { font-size: 30px; }

        /* Scroll container */
        .spots-scroll-wrap {
          position: relative;
        }
        .spots-scroll-wrap::after {
          content: '';
          position: absolute;
          top: 0; right: -24px; bottom: 0;
          width: 54px;
          background: linear-gradient(to right, transparent, #f5f4f0 60%);
          pointer-events: none;
        }

        .spots-scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
        }
        .spots-scroll::-webkit-scrollbar { display: none; }
        .spots-scroll { scrollbar-width: none; }

        /* Card width inside scroll */
        .spots-scroll .spot-card {
          width: 240px;
          flex-shrink: 0;
          scroll-snap-align: start;
        }

        /* Skeleton width inside scroll */
        .spots-scroll .spot-skeleton {
          width: 240px;
          flex-shrink: 0;
          scroll-snap-align: start;
          height: 220px;
          border-radius: 20px;
          background: #ede9e1;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @media (max-width: 480px) {
          .spots-scroll .spot-card     { width: 200px; }
          .spots-scroll .spot-skeleton { width: 200px; height: 180px; }
          .spot-section-title          { font-size: 22px; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

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

      {/* Scroll gallery */}
      <div className="spots-scroll-wrap">
        <div className="spots-scroll">
          {loading
            ? [...Array(6)].map((_, i) => <div key={i} className="spot-skeleton" />)
            : <SpotList spots={spots} />
          }
        </div>
      </div>

    </section>
  )
}