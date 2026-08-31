"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import SpotList from "@/components/spots/SpotList"
import Pill from "@/components/ui/Pill"
import CircleArrow from "@/components/ui/CircleArrow"


function VerTodoCard() {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="ver-todo-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span className="ver-todo-label">Ver todo</span>
      <CircleArrow active={hov} />
    </div>
  )
}

function NavArrow({ dir, enabled, onClick }) {
  const [hovered, setHovered] = useState(false)
  const on = enabled && hovered

  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28,
        borderRadius: "50%",
        border: `1px solid ${on ? "var(--primary-dark)" : enabled ? "var(--border)" : "#ede9e1"}`,
        background: on ? "var(--primary-dark)" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13,
        color: on ? "#fff" : enabled ? "var(--muted)" : "#d4d0c8",
        flexShrink: 0,
        cursor: enabled ? "pointer" : "default",
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        padding: 0,
      }}
    >
      {dir === "left" ? "←" : "→"}
    </button>
  )
}

export default function SpotSection({ label, title, count, spots, loading, href }) {
  const [hovered, setHovered] = useState(false)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(false)
  const scrollRef = useRef(null)

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    updateArrows()
  }, [spots, loading])

  const scrollBy = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const target = dir > 0 ? el.scrollWidth - el.clientWidth : 0
    el.scrollTo({ left: target, behavior: "smooth" })
    if (dir > 0) { setCanRight(false); setCanLeft(true) }
    else         { setCanLeft(false);  setCanRight(el.scrollWidth > el.clientWidth + 4) }
  }

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
        color: hovered ? "var(--primary)" : "#1b1b19",
        margin: 0, lineHeight: 1.2,
        transition: "color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        {title}
      </h2>
      {count > 0 && (
        <Pill variant="dark-green" hover style={{ fontSize: 12, padding: "3px 12px", flexShrink: 0 }}>
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

        .spots-scroll-wrap {
          position: relative;
        }
        .spots-scroll-wrap::before,
        .spots-scroll-wrap::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 54px;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 1;
        }
        .spots-scroll-wrap::after {
          right: -24px;
          background: linear-gradient(to right, transparent, #f5f4f0 60%);
        }
        .spots-scroll-wrap::before {
          left: -24px;
          background: linear-gradient(to left, transparent, #f5f4f0 60%);
          opacity: 0;
        }
        .spots-scroll-wrap.at-end::after  { opacity: 0; }
        .spots-scroll-wrap.at-end::before { opacity: 1; }

        .spots-scroll {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-top: 16px;
          margin-top: -16px;
          padding-bottom: 16px;
          margin-bottom: -8px;
        }
        .spots-scroll::-webkit-scrollbar { display: none; }
        .spots-scroll { scrollbar-width: none; }

        .spots-scroll .spot-card {
          width: 180px;
          flex-shrink: 0;
          scroll-snap-align: start;
        }

        .spots-scroll .spot-card-img-wrap {
          aspect-ratio: 1 / 1 !important;
          height: auto !important;
        }

        .spots-scroll .spot-skeleton {
          width: 180px;
          flex-shrink: 0;
          scroll-snap-align: start;
          height: 240px;
          border-radius: 20px;
          background: #ede9e1;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .ver-todo-card {
          width: 180px;
          flex-shrink: 0;
          scroll-snap-align: start;
          height: 256px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .ver-todo-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .ver-todo-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #1b1b19;
        }

        /* Nav arrows — ocultos en mobile */
        .gallery-nav { display: flex; gap: 6px; }
        @media (max-width: 768px) {
          .gallery-nav { display: none; }
        }

        @media (max-width: 480px) {
          .spots-scroll .spot-card     { width: 200px; }
          .spots-scroll .spot-skeleton { width: 200px; height: 260px; }
          .spot-section-title          { font-size: 22px; }
          .ver-todo-card               { width: 200px; height: 276px; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
            {label}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {href
            ? <Link href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{titleRow}</Link>
            : titleRow
          }

          {!loading && spots.length >= 5 && (
            <div className="gallery-nav">
              <NavArrow dir="left"  enabled={canLeft}  onClick={() => scrollBy(-1)} />
              <NavArrow dir="right" enabled={canRight} onClick={() => scrollBy(1)} />
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />

      {/* Scroll gallery */}
      <div className={`spots-scroll-wrap${!canRight && canLeft ? " at-end" : ""}`}>
        <div className="spots-scroll" ref={scrollRef} onScroll={updateArrows}>
          {loading
            ? [...Array(6)].map((_, i) => <div key={i} className="spot-skeleton" />)
            : <>
                <SpotList spots={spots} />
                {href && spots.length >= 5 && (
                  <Link href={href} style={{ textDecoration: "none", flexShrink: 0 }}>
                    <VerTodoCard />
                  </Link>
                )}
              </>
          }
        </div>
      </div>

    </section>
  )
}
