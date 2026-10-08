"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import SpotCard from "../../components/spots/SpotCard"
import Navbar from "../../components/layout/Navbar"
import Pill from "../../components/ui/Pill"
import FilterDrawer from "../../components/spots/TrekkingFilters"
import KayakFilterDrawer from "../../components/spots/KayakFilters"
import SurfFilterDrawer from "../../components/spots/SurfFilters"
import ClimbingFilterDrawer from "../../components/spots/ClimbingFilters"
import CampingFilterDrawer from "../../components/spots/CampingFilters"
import { GlampingFilterDrawer, MotorhomeFilterDrawer } from "../../components/spots/StayFilters"
import type { GlampingFilterState, MotorhomeFilterState } from "../../lib/stay-filters"
import type { TrekkingFilterState } from "../../lib/trekking-filters"
import type { KayakFilterState } from "../../lib/kayak-filters"
import type { SurfFilterState } from "../../lib/surf-filters"
import type { ClimbingFilterState } from "../../lib/climbing-filters"
import type { CampingFilterState } from "../../lib/camping-filters"
import {
  CODECS, PRACTICAL_FILTERS, SORT_OPTIONS, filterChips, hasFilterPanel, isPracticalOn, sortOf,
  withPanelFilters, withPractical, withSort, withoutActivity, withoutFilters, withoutPair,
  type FilterActivity,
} from "../../lib/searchFilters"
import { trackEvent } from "../../lib/analytics"
import { api } from "../../lib/api"
import { categoryEmoji } from "../../lib/categories"
import type { SpotListItem } from "../../lib/types"
import "./search.css"

const SpotsMap = dynamic(() => import("../../components/spots/SpotsMap"), { ssr: false })

const PAGE_SIZE = 24

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activity   = searchParams.get("activity")   || ""
  const department = searchParams.get("department") || ""
  const sort = sortOf(searchParams)

  const [spots, setSpots]                         = useState<SpotListItem[]>([])
  const [total, setTotal]                         = useState<number | null>(null)
  const [loading, setLoading]                     = useState(true)
  const [error, setError]                         = useState<string | null>(null)
  const [retryTick, setRetryTick]                 = useState(0)
  const [loadingMore, setLoadingMore]             = useState(false)
  const [loadMoreError, setLoadMoreError]         = useState<string | null>(null)
  const [mapSpots, setMapSpots]                   = useState<SpotListItem[]>([])
  const [highlightedSpotId, setHighlightedSpotId] = useState<number | null>(null)
  const [mapExpanded, setMapExpanded]             = useState(false)
  const [filterOpen, setFilterOpen]               = useState(false)

  // Los filtros viven en la URL (lib/searchFilters.ts): se leen de ahí y
  // aplicarlos, quitarlos u ordenar cambia la URL. Así sobreviven a recargar
  // y a volver atrás, y el link se puede compartir.
  const panelActivity: FilterActivity | null = hasFilterPanel(activity) ? activity : null
  const panelFilters = panelActivity ? CODECS[panelActivity].fromParams(searchParams) : null
  const panelCount = panelActivity && panelFilters
    ? (CODECS[panelActivity].count as (s: typeof panelFilters) => number)(panelFilters)
    : 0
  const allChips = filterChips(searchParams)
  // Los prácticos se ven como botones prendidos; acá van los del panel.
  const panelChips = allChips.filter(c => !PRACTICAL_FILTERS.some(f => f.param === c.key))
  const activeFilterCount = allChips.length

  function go(params: URLSearchParams) {
    const query = params.toString()
    router.replace(query ? `/search?${query}` : "/search", { scroll: false })
  }

  function applyPanel<A extends FilterActivity>(a: A, state: unknown) {
    go(withPanelFilters(searchParams, a, state as never))
  }

  // Compartido entre el efecto principal y "Cargar más": si cambian los
  // filtros mientras cualquiera de los dos está en vuelo, se cancela el
  // anterior en vez de dejar que una respuesta vieja pise el estado nuevo.
  const fetchControllerRef = useRef<AbortController | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [atTop, setAtTop]       = useState(true)
  const [atBottom, setAtBottom] = useState(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAtTop(el.scrollTop < 8)
    setAtBottom(el.scrollTop >= el.scrollHeight - el.clientHeight - 8)
  }

  // Con resultados nuevos (o más), las sombras de arriba y abajo se recalculan
  // midiendo la lista, como al scrollear.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || loading) return
    setAtTop(el.scrollTop < 8)
    setAtBottom(el.scrollTop >= el.scrollHeight - el.clientHeight - 8)
  }, [spots, loading])

  // Lo que se le pide al backend: lo mismo que la URL, con el orden siempre
  // explícito. El mapa no ordena ni pagina (necesita todos los pines).
  const listParams = () => {
    const params = new URLSearchParams(searchParams)
    params.set("sort", sort)
    return params
  }

  // Lo que define la búsqueda: si cambia (o se reintenta), se vuelve a pedir.
  // "Cargando" se prende durante el render, no en el efecto, para no pintar
  // un cuadro con los resultados viejos y sin aviso.
  const searchKey = `${searchParams.toString()}#${retryTick}`
  const [searchedKey, setSearchedKey] = useState(searchKey)
  if (searchKey !== searchedKey) {
    setSearchedKey(searchKey)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    fetchControllerRef.current?.abort()
    const controller = new AbortController()
    fetchControllerRef.current = controller

    const params = listParams()
    params.set("limit", String(PAGE_SIZE))
    params.set("offset", "0")
    api.get<SpotListItem[]>(`/spots?${params.toString()}`, { signal: controller.signal })
      .then(({ data, totalCount }) => {
        setTotal(totalCount)
        setSpots(data)
        setLoading(false)
        trackEvent("search", {
          search_term: activity || department || "todos",
          activity: activity || undefined,
          department: department || undefined,
          filter_count: activeFilterCount,
          result_count: Array.isArray(data) ? data.length : undefined,
        })
      })
      .catch(e => {
        if (e?.name === "AbortError") return
        setError(e instanceof Error ? e.message : "Error al cargar los lugares.")
        setLoading(false)
      })

    // Pines del mapa: mismos filtros, sin paginar — no se vuelve a pedir
    // cuando el usuario aprieta "Cargar más" en la lista, ya tiene todo.
    // Si falla, el mapa se queda vacío (degrada solo, no bloquea la lista).
    const mapParams = new URLSearchParams(searchParams)
    mapParams.delete("sort")
    api.get<SpotListItem[]>(`/spots/pins?${mapParams.toString()}`, { signal: controller.signal })
      .then(({ data }) => setMapSpots(Array.isArray(data) ? data : []))
      .catch(e => {
        if (e?.name === "AbortError") return
        setMapSpots([])
      })

    return () => controller.abort()
    // searchKey resume la URL (actividad, departamento, filtros y orden) y retryTick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey])

  const loadMore = () => {
    if (loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(null)

    fetchControllerRef.current?.abort()
    const controller = new AbortController()
    fetchControllerRef.current = controller

    const params = listParams()
    params.set("limit", String(PAGE_SIZE))
    params.set("offset", String(spots.length))
    api.get<SpotListItem[]>(`/spots?${params.toString()}`, { signal: controller.signal })
      .then(({ data, totalCount }) => {
        if (totalCount != null) setTotal(totalCount)
        setSpots(prev => [...prev, ...(Array.isArray(data) ? data : [])])
        setLoadingMore(false)
      })
      .catch(e => {
        if (e?.name === "AbortError") return
        setLoadMoreError(e instanceof Error ? e.message : "Error al cargar más lugares.")
        setLoadingMore(false)
      })
  }

  const hasMore = total !== null && spots.length < total

  // Sin filtros (quedan actividad, departamento y orden).
  function clearFilters() {
    go(withoutFilters(searchParams))
  }

  const title = activity && department
    ? `${activity} en ${department}`
    : activity   ? activity
    : department ? `Lugares en ${department}`
    : "Todos los lugares"

  const canFilter = !!panelActivity

  return (
    <div className="search-root">
      <Navbar />

      <div className="search-layout">

        {/* ── Lista ── */}
        <div className="search-list-panel">

          {/* Header fijo */}
          <div className="fade-up fade-up-1 search-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                Resultados de búsqueda
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 30, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                {title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {!loading && (
                  <Pill variant="dark-green" hover style={{ fontSize: 12, padding: "3px 12px" }}>
                    {total ?? spots.length}
                  </Pill>
                )}
                <select
                  aria-label="Ordenar"
                  className="search-sort"
                  value={sort}
                  onChange={e => go(withSort(searchParams, e.target.value))}
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {canFilter && (
                  <button
                    className={`filter-trigger-btn${panelCount > 0 ? " has-filters" : ""}`}
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
                    Filtros
                    {panelCount > 0 && (
                      <span className="filter-badge">{panelCount}</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Lo aplicado, cada uno con ✕ para quitarlo. */}
            {(activity || department || panelChips.length > 0) && (
              <div className="search-chips" aria-label="Filtros aplicados">
                {activity && (
                  <span className="search-chip">
                    {categoryEmoji(activity)} {activity}
                    <button aria-label={`Quitar ${activity}`} onClick={() => go(withoutActivity(searchParams))}>✕</button>
                  </span>
                )}
                {department && (
                  <span className="search-chip is-dark">
                    📍 {department}
                    <button aria-label={`Quitar ${department}`} onClick={() => go(withoutPair(searchParams, "department", department))}>✕</button>
                  </span>
                )}
                {panelChips.map(chip => (
                  <span key={`${chip.key}=${chip.value}`} className="search-chip is-light">
                    {chip.label}
                    <button aria-label={`Quitar ${chip.label}`} onClick={() => go(withoutPair(searchParams, chip.key, chip.value))}>✕</button>
                  </span>
                ))}
                {activeFilterCount > 0 && (
                  <button className="search-clear" onClick={clearFilters}>Limpiar filtros</button>
                )}
              </div>
            )}

            {/* Información práctica: para cualquier búsqueda. */}
            <div className="search-chips" aria-label="Filtros rápidos">
              {PRACTICAL_FILTERS.map(f => {
                const on = isPracticalOn(searchParams, f.param)
                return (
                  <button
                    key={f.param}
                    className={`search-toggle${on ? " is-on" : ""}`}
                    aria-pressed={on}
                    onClick={() => go(withPractical(searchParams, f.param, !on))}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            <div className="fade-up fade-up-2" style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
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
                  background: "#fff", border: "1px solid var(--border)",
                  borderRadius: 20, padding: "60px 40px",
                  textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</p>
                  <button
                    onClick={() => setRetryTick(t => t + 1)}
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: 13, fontWeight: 600,
                      color: "var(--primary)", background: "#fff",
                      border: "1px solid var(--primary)", borderRadius: 10,
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
                  background: "#fff", border: "1px solid var(--border)",
                  borderRadius: 20, padding: "60px 40px",
                  textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>🗺️</p>
                  <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", marginBottom: 6 }}>
                    {activeFilterCount > 0 ? "No hay lugares con estos filtros" : "Todavía no hay lugares acá"}
                  </p>
                  {activeFilterCount > 0 ? (
                    <button onClick={clearFilters} style={{
                      marginTop: 8, padding: "9px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                      fontFamily: "inherit", cursor: "pointer", background: "#fff", color: "var(--primary-dark)", border: "1px solid #b7dfc8",
                    }}>
                      Quitar filtros
                    </button>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                      ¿Conocés uno? <Link href="/agregar-lugar" style={{ color: "var(--primary)", fontWeight: 600 }}>Sumalo</Link>
                    </p>
                  )}
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
                        <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{loadMoreError}</p>
                      )}
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        style={{
                          padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                          fontFamily: "var(--font-dm-sans), sans-serif", cursor: loadingMore ? "default" : "pointer",
                          background: "#fff", color: "var(--primary-dark)", border: "1px solid #b7dfc8",
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
          <div className="map-inner" style={{ height: "100%", borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

            {!loading && mapSpots.length === 0 && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000, pointerEvents: "none",
                background: "#fff", border: "1px solid var(--border)",
                borderRadius: 16, padding: "14px 22px", textAlign: "center",
              }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                  No hay lugares para mostrar en el mapa
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
                  {activeFilterCount > 0 ? "Probá quitando algún filtro" : "Ninguno tiene ubicación cargada"}
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

      {panelActivity === "Trekking" && (
        <FilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as TrekkingFilterState}
          onApply={f => applyPanel("Trekking", f)}
        />
      )}
      {panelActivity === "Kayak" && (
        <KayakFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as KayakFilterState}
          onApply={f => applyPanel("Kayak", f)}
        />
      )}
      {panelActivity === "Surf" && (
        <SurfFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as SurfFilterState}
          onApply={f => applyPanel("Surf", f)}
        />
      )}
      {panelActivity === "Escalada" && (
        <ClimbingFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as ClimbingFilterState}
          onApply={f => applyPanel("Escalada", f)}
        />
      )}
      {panelActivity === "Camping" && (
        <CampingFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as CampingFilterState}
          onApply={f => applyPanel("Camping", f)}
        />
      )}
      {panelActivity === "Glamping" && (
        <GlampingFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as GlampingFilterState}
          onApply={f => applyPanel("Glamping", f)}
        />
      )}
      {panelActivity === "Motorhome" && (
        <MotorhomeFilterDrawer
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          appliedFilters={panelFilters as MotorhomeFilterState}
          onApply={f => applyPanel("Motorhome", f)}
        />
      )}
    </div>
  )
}
