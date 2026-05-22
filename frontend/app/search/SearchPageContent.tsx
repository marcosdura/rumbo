"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import SpotCard from "../../components/spots/SpotCard"
import Navbar from "../../components/layout/Navbar"

const SpotsMap = dynamic(() => import("../../components/spots/SpotsMap"), { ssr: false })

export default function SearchPage() {
  const searchParams = useSearchParams()
  const activity   = searchParams.get("activity")   || ""
  const department = searchParams.get("department") || ""

  const [spots, setSpots]                   = useState([])
  const [loading, setLoading]               = useState(true)
  const [highlightedSpotId, setHighlightedSpotId] = useState(null)
  const [mapExpanded, setMapExpanded]       = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [atTop, setAtTop]       = useState(true)
  const [atBottom, setAtBottom] = useState(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAtTop(el.scrollTop < 8)
    setAtBottom(el.scrollTop >= el.scrollHeight - el.clientHeight - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el || loading) return
    setAtTop(true)
    setAtBottom(el.scrollHeight <= el.clientHeight + 8)
  }, [spots, loading])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activity)   params.append("activity", activity)
    if (department) params.append("department", department)
    fetch(`http://127.0.0.1:8000/spots?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setSpots(data); setLoading(false) })
  }, [activity, department])

  const title = activity && department
    ? `${activity} en ${department}`
    : activity   ? activity
    : department ? `Spots en ${department}`
    : "Todos los spots"

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fade-up   { opacity: 0; transform: translateY(18px); animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }

        .leaflet-container { border-radius: 16px; }

        .cards-scroll { direction: rtl; }
        .cards-scroll > * { direction: ltr; }
        .cards-scroll::-webkit-scrollbar { width: 6px; }
        .cards-scroll::-webkit-scrollbar-track {
          background: #ede9e1;
          border-radius: 6px;
          margin: 0;
        }
        .cards-scroll::-webkit-scrollbar-thumb {
          background: #a8a39a;
          border-radius: 6px;
        }
        .cards-scroll::-webkit-scrollbar-thumb:hover { background: #7a7669; }

        .search-layout {
          flex: 1; display: flex; overflow: hidden;
          font-family: 'DM Sans', sans-serif; justify-content: center;
        }
        .search-list-panel {
          width: 700px; flex-shrink: 0; display: flex;
          flex-direction: column; overflow: hidden; padding-bottom: 20px;
        }
        .search-map-panel {
          width: 700px; flex-shrink: 0; padding: 20px;
          position: relative; z-index: 0;
        }
        .search-header { padding: 36px 24px 0; flex-shrink: 0; }
        .search-cards-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .search-skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .map-expand-btn {
          display: none;
          position: absolute;
          top: 12px; right: 12px;
          z-index: 500;
          align-items: center; gap: 5px;
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 10px;
          padding: 7px 12px;
          cursor: pointer;
          font-size: 13px; font-weight: 600;
          color: #1b1b19;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: background 0.18s;
        }
        .map-expand-btn:hover { background: #f7f5f0; }

        @media (max-width: 768px) {
          .search-layout { flex-direction: column; justify-content: flex-start; }
          .search-list-panel { width: 100%; flex: 3; padding-bottom: 0; }
          .search-map-panel  { width: 100%; flex: 2; padding: 12px; }
          .search-header     { padding: 20px 16px 0; }
          .search-cards-grid    { grid-template-columns: 1fr; gap: 12px; }
          .search-skeleton-grid { grid-template-columns: 1fr; }
          .cards-scroll { direction: ltr; }
          .cards-scroll > * { direction: ltr; }
          .cards-scroll::-webkit-scrollbar { width: 3px; }
          .map-expand-btn { display: flex; }
          .search-map-expanded {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            z-index: 999 !important;
            flex: unset !important;
          }
          .search-map-expanded .map-inner {
            border-radius: 0 !important;
            border: none !important;
          }
          .search-map-expanded .map-expand-btn {
            top: 16px; right: 16px;
          }
        }
      `}</style>

      <Navbar />

      <div className="search-layout">

        {/* ── Lista ── */}
        <div className="search-list-panel">

          {/* Header fijo */}
          <div className="fade-up fade-up-1 search-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                Resultados de búsqueda
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
                {title}
              </h1>
              {!loading && (
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  padding: "3px 12px", borderRadius: 999,
                  background: "#1b4332", color: "#d8f3dc",
                  border: "1px solid #2d6a4f",
                  letterSpacing: "0.03em", flexShrink: 0,
                }}>
                  {spots.length}
                </span>
              )}
            </div>

            {(activity || department) && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {activity && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600,
                    padding: "4px 10px", borderRadius: 999,
                    background: "#e8f5ee", color: "#1b4332", border: "1px solid #b7dfc8",
                  }}>
                    🏃 {activity}
                  </span>
                )}
                {department && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600,
                    padding: "4px 10px", borderRadius: 999,
                    background: "#1b4332", color: "#d8f3dc", border: "1px solid #2d6a4f",
                  }}>
                    📍 {department}
                  </span>
                )}
              </div>
            )}

            <div className="fade-up fade-up-2" style={{ height: 1, background: "#e0ddd6", marginTop: 16 }} />
          </div>

          {/* Cards scrolleables */}
          <div className="fade-up fade-up-3" style={{ flex: 1, position: "relative", overflow: "hidden" }}>

            {/* Fade top */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 52,
              background: "linear-gradient(to bottom, #f5f4f0, transparent)",
              pointerEvents: "none", zIndex: 2,
              opacity: atTop ? 0 : 1, transition: "opacity 0.25s",
            }} />

            <div
              ref={scrollRef}
              className="cards-scroll"
              style={{ height: "100%", overflowY: "auto", padding: "24px 24px 20px" }}
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="search-skeleton-grid">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ height: 240, borderRadius: 20, background: "#ede9e1", animation: "pulse 1.5s infinite" }} />
                  ))}
                </div>
              ) : spots.length === 0 ? (
                <div style={{
                  background: "#fff", border: "1px solid #e0ddd6",
                  borderRadius: 20, padding: "60px 40px",
                  textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>🗺️</p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", marginBottom: 6 }}>
                    No se encontraron spots
                  </p>
                  <p style={{ fontSize: 13, color: "#9a9690" }}>
                    Probá con otros filtros
                  </p>
                </div>
              ) : (
                <div className="search-cards-grid">
                  {spots.map((spot) => (
                    <div
                      key={spot.id}
                      onMouseEnter={() => setHighlightedSpotId(spot.id)}
                      onMouseLeave={() => setHighlightedSpotId(null)}
                    >
                      <SpotCard spot={spot} isHighlighted={highlightedSpotId === spot.id} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fade bottom */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 52,
              background: "linear-gradient(to top, #f5f4f0, transparent)",
              pointerEvents: "none", zIndex: 2,
              opacity: atBottom ? 0 : 1, transition: "opacity 0.25s",
            }} />

          </div>

        </div>

        {/* Mapa */}
        <div className={`search-map-panel${mapExpanded ? " search-map-expanded" : ""}`}>
          <div className="map-inner" style={{ height: "100%", borderRadius: 20, overflow: "hidden", border: "1px solid #e0ddd6", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

            {!loading && spots.length === 0 && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000, pointerEvents: "none",
                background: "#fff", border: "1px solid #e0ddd6",
                borderRadius: 16, padding: "14px 22px", textAlign: "center",
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                  No hay spots en esta zona
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9a9690", margin: "4px 0 0" }}>
                  Probá con otros filtros
                </p>
              </div>
            )}

            <SpotsMap spots={spots} highlightedSpotId={highlightedSpotId} />
          </div>

          <button className="map-expand-btn" onClick={() => setMapExpanded(v => !v)}>
            {mapExpanded ? <><span>✕</span><span>Cerrar</span></> : <><span>⛶</span><span>Ver mapa</span></>}
          </button>
        </div>

      </div>
    </div>
  )
}