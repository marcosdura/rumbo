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

  const [spots, setSpots]                   = useState<any[]>([])
  const [loading, setLoading]               = useState(true)
  const [highlightedSpotId, setHighlightedSpotId] = useState<number | null>(null)
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots?${params.toString()}`)
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

        .mobile-map-btn-wrap { display: none; }
        .mobile-map-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #1b1b19;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: background 0.18s;
        }
        .mobile-map-btn:hover { background: #f7f5f0; }

        @media (max-width: 768px) {
          .search-layout { flex-direction: column; justify-content: flex-start; }
          .search-list-panel { width: 100%; flex: 3; padding-bottom: 0; }
          .search-map-panel  { display: none; width: 100%; padding: 12px; }
          .search-map-panel.map-visible-mobile { display: block; flex: 2; }
          .search-header     { padding: 20px 16px 0; }
          .search-cards-grid    { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .search-skeleton-grid { grid-template-columns: 1fr 1fr; }
          .search-cards-grid .spot-card-img-wrap { height: 100px !important; }
          .search-cards-grid .spot-card-body     { padding: 7px 9px 9px !important; }
          .search-cards-grid .spot-card-name     { font-size: 12px !important; margin-bottom: 4px !important; }
          .search-cards-grid .spot-card-badges   { gap: 4px !important; }
          .cards-scroll { padding-left: 12px !important; padding-right: 12px !important; }
          .cards-scroll { direction: ltr; }
          .cards-scroll > * { direction: ltr; }
          .cards-scroll::-webkit-scrollbar { width: 3px; }
          .mobile-map-btn-wrap { display: block; padding: 8px 16px 0; }
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

          {/* Mobile map toggle */}
          <div className="mobile-map-btn-wrap">
            <button className="mobile-map-btn" onClick={() => setMapExpanded(v => !v)}>
              {mapExpanded ? "Ocultar mapa" : "Ver mapa 🗺️"}
            </button>
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
        <div className={`search-map-panel${mapExpanded ? " map-visible-mobile" : ""}`}>
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

            <SpotsMap spots={spots} highlightedSpotId={highlightedSpotId} mapExpanded={mapExpanded} />
          </div>

        </div>

      </div>
    </div>
  )
}