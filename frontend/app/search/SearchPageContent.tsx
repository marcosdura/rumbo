"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import SpotCard from "../../components/spots/SpotCard"
import Navbar from "../../components/layout/Navbar"
import Pill from "../../components/ui/Pill"
import FilterDrawer from "../../components/spots/TrekkingFilters"
import KayakFilterDrawer from "../../components/spots/KayakFilters"
import SurfFilterDrawer from "../../components/spots/SurfFilters"
import ClimbingFilterDrawer from "../../components/spots/ClimbingFilters"
import CampingFilterDrawer from "../../components/spots/CampingFilters"
import {
  TrekkingFilterState,
  EMPTY_TREKKING_FILTERS,
  countActiveFilters,
} from "../../lib/trekking-filters"
import {
  KayakFilterState,
  EMPTY_KAYAK_FILTERS,
  countActiveKayakFilters,
} from "../../lib/kayak-filters"
import {
  SurfFilterState,
  EMPTY_SURF_FILTERS,
  countActiveSurfFilters,
} from "../../lib/surf-filters"
import {
  ClimbingFilterState,
  EMPTY_CLIMBING_FILTERS,
  countActiveClimbingFilters,
} from "../../lib/climbing-filters"
import {
  CampingFilterState,
  EMPTY_CAMPING_FILTERS,
  countActiveCampingFilters,
} from "../../lib/camping-filters"
import { trackEvent } from "../../lib/analytics"
import { api } from "../../lib/api"

const SpotsMap = dynamic(() => import("../../components/spots/SpotsMap"), { ssr: false })

const PAGE_SIZE = 24

export default function SearchPage() {
  const searchParams = useSearchParams()
  const activity   = searchParams.get("activity")   || ""
  const department = searchParams.get("department") || ""

  const [spots, setSpots]                         = useState<any[]>([])
  const [total, setTotal]                         = useState<number | null>(null)
  const [loading, setLoading]                     = useState(true)
  const [error, setError]                         = useState<string | null>(null)
  const [retryTick, setRetryTick]                 = useState(0)
  const [loadingMore, setLoadingMore]             = useState(false)
  const [loadMoreError, setLoadMoreError]         = useState<string | null>(null)
  const [mapSpots, setMapSpots]                   = useState<any[]>([])
  const [highlightedSpotId, setHighlightedSpotId] = useState<number | null>(null)
  const [mapExpanded, setMapExpanded]             = useState(false)
  const [trekkingFilters, setTrekkingFilters] = useState<TrekkingFilterState>(EMPTY_TREKKING_FILTERS)
  const [kayakFilters, setKayakFilters]       = useState<KayakFilterState>(EMPTY_KAYAK_FILTERS)
  const [surfFilters, setSurfFilters]             = useState<SurfFilterState>(EMPTY_SURF_FILTERS)
  const [climbingFilters, setClimbingFilters]     = useState<ClimbingFilterState>(EMPTY_CLIMBING_FILTERS)
  const [campingFilters, setCampingFilters]       = useState<CampingFilterState>(EMPTY_CAMPING_FILTERS)
  const [filterOpen, setFilterOpen]               = useState(false)

  useEffect(() => {
    setTrekkingFilters(EMPTY_TREKKING_FILTERS)
    setKayakFilters(EMPTY_KAYAK_FILTERS)
    setSurfFilters(EMPTY_SURF_FILTERS)
    setClimbingFilters(EMPTY_CLIMBING_FILTERS)
    setCampingFilters(EMPTY_CAMPING_FILTERS)
  }, [activity])

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

  // Los mismos filtros alimentan dos requests separados: la lista pagina,
  // el mapa no (necesita todos los pines que matcheen para el clustering).
  const buildFilterParams = () => {
    const params = new URLSearchParams()
    if (activity)   params.append("activity", activity)
    if (department) params.append("department", department)
    if (activity === "Trekking") {
      trekkingFilters.difficulties.forEach(d => params.append("difficulty", d))
      trekkingFilters.durations.forEach(d => params.append("duration", d))
      trekkingFilters.distances.forEach(d => params.append("distance", d))
      Object.entries(trekkingFilters.amenities).forEach(([k, v]) => {
        if (v) params.append(k, "true")
      })
    }
    if (activity === "Kayak") {
      kayakFilters.waterTypes.forEach(w => params.append("water_type", w))
      kayakFilters.difficulties.forEach(d => params.append("kayak_difficulty", d))
      kayakFilters.durations.forEach(d => params.append("kayak_duration", d))
      if (kayakFilters.rentalAvailable) params.append("rental_available", "true")
    }
    if (activity === "Surf") {
      surfFilters.classTypes.forEach(c => params.append("class_type", c))
      surfFilters.durations.forEach(d => params.append("surf_duration", d))
      if (surfFilters.equipmentIncluded) params.append("equipment_included", "true")
      if (surfFilters.hasSurfSchool) params.append("has_surf_school", "true")
    }
    if (activity === "Escalada") {
      climbingFilters.types.forEach(t => params.append("climbing_type", t))
      climbingFilters.gradeRanges.forEach(g => params.append("grade_range", g))
      if (climbingFilters.hasRestrictions) params.append("no_restrictions", "true")
    }
    if (activity === "Camping") {
      campingFilters.amenityIds.forEach(id => params.append("amenity_ids", String(id)))
      campingFilters.priceRanges.forEach(p => params.append("price_range", p))
    }
    return params
  }

  useEffect(() => {
    setLoading(true)
    setError(null)

    const listParams = buildFilterParams()
    listParams.set("limit", String(PAGE_SIZE))
    listParams.set("offset", "0")
    api.get<any[]>(`/spots?${listParams.toString()}`)
      .then(({ data, totalCount }) => {
        setTotal(totalCount)
        setSpots(data)
        setLoading(false)
        trackEvent("search", {
          search_term: activity || department || "todos",
          activity: activity || undefined,
          department: department || undefined,
          filter_count: Array.from(listParams.keys()).length,
          result_count: Array.isArray(data) ? data.length : undefined,
        })
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : "Error al cargar los spots.")
        setLoading(false)
      })

    // Pines del mapa: mismos filtros, sin paginar — no se vuelve a pedir
    // cuando el usuario aprieta "Cargar más" en la lista, ya tiene todo.
    // Si falla, el mapa se queda vacío (degrada solo, no bloquea la lista).
    const mapParams = buildFilterParams()
    api.get<any[]>(`/spots/pins?${mapParams.toString()}`)
      .then(({ data }) => setMapSpots(Array.isArray(data) ? data : []))
      .catch(() => setMapSpots([]))
  }, [activity, department, trekkingFilters, kayakFilters, surfFilters, climbingFilters, campingFilters, retryTick])

  const loadMore = () => {
    if (loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(null)
    const params = buildFilterParams()
    params.set("limit", String(PAGE_SIZE))
    params.set("offset", String(spots.length))
    api.get<any[]>(`/spots?${params.toString()}`)
      .then(({ data, totalCount }) => {
        if (totalCount != null) setTotal(totalCount)
        setSpots(prev => [...prev, ...(Array.isArray(data) ? data : [])])
        setLoadingMore(false)
      })
      .catch(e => {
        setLoadMoreError(e instanceof Error ? e.message : "Error al cargar más spots.")
        setLoadingMore(false)
      })
  }

  const hasMore = total !== null && spots.length < total

  const title = activity && department
    ? `${activity} en ${department}`
    : activity   ? activity
    : department ? `Spots en ${department}`
    : "Todos los spots"

  const activeFilterCount =
    activity === "Trekking"  ? countActiveFilters(trekkingFilters)           :
    activity === "Kayak"     ? countActiveKayakFilters(kayakFilters)         :
    activity === "Surf"      ? countActiveSurfFilters(surfFilters)           :
    activity === "Escalada"  ? countActiveClimbingFilters(climbingFilters)   :
    activity === "Camping"   ? countActiveCampingFilters(campingFilters)     : 0
  const canFilter = !!activity

  return (
    <div className="search-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .search-root {
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #f5f4f0;
        }

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
        .search-cards-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .search-skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .search-cards-grid .spot-card-img-wrap {
          aspect-ratio: 4 / 3 !important;
          height: auto !important;
        }

        .filter-trigger-btn {
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #3d3d3a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
          position: relative;
        }
        .filter-trigger-btn:hover {
          background: #f0f7f3;
          border-color: #b7dfc8;
          color: #1b4332;
        }
        .filter-trigger-btn.has-filters {
          background: #e8f5ee;
          border-color: #2d6a4f;
          color: #1b4332;
        }
        .filter-trigger-icon {
          display: flex; align-items: center;
        }
        .filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #2d6a4f;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

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

        .map-close-btn { display: none; }

        @media (max-width: 768px) {
          .search-layout { flex-direction: column; justify-content: flex-start; }
          .search-list-panel { width: 100%; flex: 3; padding-bottom: 0; }
          .search-map-panel  { display: none; width: 100%; padding: 12px; }
          .search-map-panel.map-visible-mobile {
            display: block;
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            z-index: 1000;
            padding: 0 !important;
          }
          .search-map-panel.map-visible-mobile .map-inner {
            border-radius: 0 !important;
            border: none !important;
          }
          .search-map-panel.map-visible-mobile .leaflet-container {
            border-radius: 0 !important;
          }
          .map-close-btn {
            display: flex;
            position: absolute;
            top: 12px; right: 12px;
            z-index: 1001;
            align-items: center;
            gap: 6px;
            background: #fff;
            border: 1px solid #e0ddd6;
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            transition: background 0.18s;
          }
          .map-close-btn:hover { background: #f7f5f0; }
          .search-header     { padding: 20px 16px 0; }
          .search-cards-grid    { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .search-skeleton-grid { grid-template-columns: 1fr 1fr; }
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
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                {title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {!loading && (
                  <Pill variant="dark-green" hover style={{ fontSize: 12, padding: "3px 12px" }}>
                    {total ?? spots.length}
                  </Pill>
                )}
                {canFilter && (
                  <button
                    className={`filter-trigger-btn${activeFilterCount > 0 ? " has-filters" : ""}`}
                    onClick={() => setFilterOpen(true)}
                  >
                    <span className="filter-trigger-icon">
                      {/* sliders icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6"/>
                        <line x1="4" y1="12" x2="20" y2="12"/>
                        <line x1="4" y1="18" x2="20" y2="18"/>
                        <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/>
                        <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/>
                        <circle cx="9" cy="18" r="2" fill="currentColor" stroke="none"/>
                      </svg>
                    </span>
                    {activeFilterCount > 0 ? `Filtros · ${activeFilterCount}` : "Filtros"}
                    {activeFilterCount > 0 && (
                      <span className="filter-badge">{activeFilterCount}</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {(activity || department) && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {activity && (
                  <Pill variant="green" hover>
                    {({ Camping:"🏕️", Glamping:"🛖", Trekking:"🥾", Escalada:"🧗", Surf:"🏄", Kayak:"🛶" } as Record<string,string>)[activity] ?? "🏃"} {activity}
                  </Pill>
                )}
                {department && (
                  <Pill variant="dark-green" hover>📍 {department}</Pill>
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
              {error ? (
                <div style={{
                  background: "#fff", border: "1px solid #e0ddd6",
                  borderRadius: 20, padding: "60px 40px",
                  textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</p>
                  <button
                    onClick={() => setRetryTick(t => t + 1)}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13, fontWeight: 600,
                      color: "#2d6a4f", background: "#fff",
                      border: "1px solid #2d6a4f", borderRadius: 10,
                      padding: "10px 20px", cursor: "pointer",
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              ) : loading ? (
                <div className="search-skeleton-grid">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ height: 300, borderRadius: 20, background: "#ede9e1", animation: "pulse 1.5s infinite" }} />
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
                <>
                  <div className="search-cards-grid">
                    {spots.map((spot) => (
                      <div
                        key={spot.id}
                        onMouseEnter={() => setHighlightedSpotId(spot.id)}
                        onMouseLeave={() => setHighlightedSpotId(null)}
                      >
                        <SpotCard spot={spot} isHighlighted={highlightedSpotId === spot.id} activeCategory={activity} />
                      </div>
                    ))}
                  </div>

                  {hasMore && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 20 }}>
                      {loadMoreError && (
                        <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{loadMoreError}</p>
                      )}
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        style={{
                          padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif", cursor: loadingMore ? "default" : "pointer",
                          background: "#fff", color: "#1b4332", border: "1px solid #b7dfc8",
                          opacity: loadingMore ? 0.6 : 1,
                        }}
                      >
                        {loadingMore ? "Cargando..." : loadMoreError ? "Reintentar" : `Cargar más (${total! - spots.length} más)`}
                      </button>
                    </div>
                  )}
                </>
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

            {!loading && mapSpots.length === 0 && (
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

            <SpotsMap spots={mapSpots} highlightedSpotId={highlightedSpotId} mapExpanded={mapExpanded} activeCategory={activity} />
          </div>

          <button className="map-close-btn" onClick={() => setMapExpanded(false)}>
            ✕ Cerrar mapa
          </button>
        </div>

      </div>

      {activity === "Trekking" && (
        <FilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={trekkingFilters}
          onApply={setTrekkingFilters}
        />
      )}
      {activity === "Kayak" && (
        <KayakFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={kayakFilters}
          onApply={setKayakFilters}
        />
      )}
      {activity === "Surf" && (
        <SurfFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={surfFilters}
          onApply={setSurfFilters}
        />
      )}
      {activity === "Escalada" && (
        <ClimbingFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={climbingFilters}
          onApply={setClimbingFilters}
        />
      )}
      {activity === "Camping" && (
        <CampingFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={campingFilters}
          onApply={setCampingFilters}
        />
      )}
    </div>
  )
}
