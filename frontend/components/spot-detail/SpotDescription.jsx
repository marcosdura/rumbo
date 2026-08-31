"use client"

import { useEffect, useRef, useState } from "react"

const COLLAPSED_HEIGHT = 120 // px, ~4-5 líneas con el font-size/line-height actual

function SpotDescription({ description }) {
  const [isMobile, setIsMobile] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (textRef.current) {
      setNeedsTruncation(textRef.current.scrollHeight > COLLAPSED_HEIGHT + 4)
    }
  }, [description])

  const shouldClamp = isMobile && needsTruncation && !expanded

  return (
    <>
      <style>{`
        .spot-desc-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          font-family: 'DM Sans', sans-serif;
        }
        @media (max-width: 768px) {
          .spot-desc-card { padding: 20px 16px; }
        }

        .spot-desc-text-wrap {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .spot-desc-toggle {
          display: inline-block;
          background: none;
          border: none;
          padding: 10px 0 0;
          margin: 0;
          color: var(--primary);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .spot-desc-toggle:hover { opacity: 0.7; }
      `}</style>
      <div className="spot-desc-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
            Descripción
          </h2>
        </div>
        <div
          className="spot-desc-text-wrap"
          style={{ maxHeight: shouldClamp ? COLLAPSED_HEIGHT : 4000 }}
        >
          <p ref={textRef} style={{ fontSize: 15, lineHeight: 1.75, color: "#2c2c2a", margin: 0, fontWeight: 400 }}>
            {description}
          </p>
        </div>
        {isMobile && needsTruncation && (
          <button className="spot-desc-toggle" onClick={() => setExpanded(v => !v)}>
            {expanded ? "Leer menos ↑" : "Leer más ↓"}
          </button>
        )}
      </div>
    </>
  )
}

export default SpotDescription
