"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import SpotCard from "../../components/SpotCard"
import Navbar from "../../components/Navbar"

const SpotsMap = dynamic(() => import("../../components/SpotsMap"), { ssr: false });

export default function SearchPage() {
  const searchParams = useSearchParams()
  const activity = searchParams.get("activity") || ""
  const department = searchParams.get("department") || ""

  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlightedSpotId, setHighlightedSpotId] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activity) params.append("activity", activity)
    if (department) params.append("department", department)

    fetch(`http://127.0.0.1:8000/spots?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSpots(data)
        setLoading(false)
      })
  }, [activity, department])

  return (
    <div className="h-screen flex flex-col bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');
        .search-page { font-family: 'DM Sans', sans-serif; }
        .search-title { font-family: 'Playfair Display', serif; }
        .fade-up { opacity: 0; transform: translateY(18px); animation: fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .section-label { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3a0; }
        .spots-count { display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: #065f46; background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 1px solid #6ee7b7; border-radius: 20px; padding: 2px 10px; margin-left: 10px; vertical-align: middle; position: relative; top: -2px; }
        .filter-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #065f46; background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 1px solid #6ee7b7; border-radius: 999px; padding: 3px 12px; }
        .divider { height: 1px; background: linear-gradient(to right, rgba(0,0,0,0.06), transparent); margin: 0.75rem 0 1.5rem; }
        .leaflet-container { border-radius: 20px; }
      `}</style>

      <Navbar />

      <div className="flex flex-1 overflow-hidden search-page justify-center">


        {/* Lista de spots */}
        <div className="w-[700px] flex-shrink-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">

            {/* Header */}
            <div className="mb-2 fade-up fade-up-1">
              <p className="section-label">Resultados de búsqueda</p>
              <h2 className="search-title text-4xl font-semibold text-gray-900 mt-1">
                {activity && department ? `${activity} en ${department}` : activity ? activity : department ? `Spots en ${department}` : "Todos los spots"}
                {!loading && <span className="spots-count">{spots.length}</span>}
              </h2>
              {(activity || department) && (
                <div className="flex gap-2 mt-3">
                  {activity && <span className="filter-tag">🏃 {activity}</span>}
                  {department && <span className="filter-tag">📍 {department}</span>}
                </div>
              )}
            </div>

            <div className="divider fade-up fade-up-2" />

            {/* Grid */}
            <div className="fade-up fade-up-3">
              {loading ? (
                <div className="grid grid-cols-2 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(0,0,0,0.06)" }} />
                  ))}
                </div>
              ) : spots.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">No se encontraron spots</p>
                  <p className="text-gray-300 text-sm mt-1">Probá con otros filtros</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
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

          </div>
        </div>

        {/* Mapa */}
        <div className="w-[700px] flex-shrink-0 p-6" style={{ zIndex: 0, position: 'relative' }}>
          <div className="h-full rounded-2xl overflow-hidden shadow-lg">
            {!loading && spots.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.9)',
                borderRadius: '16px',
                padding: '16px 24px',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, color: '#464948', margin: 0 }}>
                  No hay spots en esta zona
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#9ca3a0', margin: '4px 0 0' }}>
                  Probá con otros filtros
                </p>
              </div>
            )}


            <SpotsMap spots={spots} highlightedSpotId={highlightedSpotId} />
          </div>
        </div>

      </div>
    </div>
  )
}