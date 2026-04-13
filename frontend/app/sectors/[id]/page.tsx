"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "../../../components/Navbar"

function ClimbingSectorDetails() {
  const { id } = useParams()
  const router = useRouter()  
  const [sector, setSector] = useState<any>(null)
  const [routes, setRoutes] = useState<any>([])

  useEffect(() => {
    fetch(`http://localhost:8000/sectors/${id}`)
      .then(res => res.json())
      .then(data => setSector(data))
  }, [id])

  useEffect(() => {
    fetch(`http://localhost:8000/sectors/${id}/routes`)
      .then(res => res.json())
      .then(data => setRoutes(data))
  }, [id])

  const gradeColor = (grade) => {
    if (!grade) return "bg-gray-100 text-gray-600"
    const g = grade.toLowerCase()
    if (g.startsWith("v")) {
      const num = parseInt(g.slice(1))
      if (num <= 3) return "bg-green-100 text-green-800"
      if (num <= 6) return "bg-yellow-100 text-yellow-800"
      if (num <= 9) return "bg-orange-100 text-orange-800"
      return "bg-red-100 text-red-800"
    }
    const num = parseFloat(g)
    if (num <= 5) return "bg-green-100 text-green-800"
    if (num <= 6) return "bg-yellow-100 text-yellow-800"
    if (num <= 7) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  if (!sector) {
    return (
      <div className="h-screen flex flex-col bg-[#f5f4f0]">
        <Navbar />
        <div className="p-8 animate-pulse max-w-6xl mx-auto w-full">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f4f0]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');
        .spot-page { font-family: 'DM Sans', sans-serif; }
        .spot-title { font-family: 'Playfair Display', serif; }
        .glass-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
        }
        .fade-up {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.2s; }
        .fade-up-3 { animation-delay: 0.3s; }
        .fade-up-4 { animation-delay: 0.4s; }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-action {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .btn-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }
        .route-row {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .route-row:hover {
          background: rgba(255,255,255,0.9);
          transform: translateX(3px);
        }
      `}</style>

      <Navbar />

      <div className="flex flex-1 overflow-hidden spot-page">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">

            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 fade-up fade-up-1"
            >
              ← Volver
            </button>

            {/* Header */}
            <div className="flex items-end justify-between mb-8 fade-up fade-up-1">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
                  Sector de Escalada
                </p>
                <h1 className="text-4xl font-semibold spot-title text-gray-900 leading-tight">
                  {sector.name}
                </h1>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-action flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600 font-medium border border-gray-100">
                  ⭐ Guardar
                </button>
                <button className="btn-action flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600 font-medium border border-gray-100">
                  🔗 Compartir
                </button>
              </div>
            </div>

            {/* Stats del sector */}
            <div className="grid grid-cols-4 gap-4 mb-6 fade-up fade-up-2">
              {[
                { icon: "📍", val: `${sector.routes_count} rutas`, lbl: "Total rutas" },
                { icon: "🎯", val: `${sector.min_grade} – ${sector.max_grade}`, lbl: "Graduación" },
                { icon: "⛰️", val: `${sector.altitude} m`, lbl: "Altitud" },
                { icon: "🧭", val: sector.orientation, lbl: "Orientación" },
              ].map(({ icon, val, lbl }) => (
                <div key={lbl} className="glass-card rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-lg font-semibold text-gray-900 spot-title">{val}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">{lbl}</p>
                </div>
              ))}
            </div>

            {/* Características del sector */}
            <div className="glass-card rounded-2xl p-6 shadow-sm mb-6 fade-up fade-up-3">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
                Características
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#f5f4f0] text-gray-700">
                  🪨 {sector.rock_type}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
                  sector.bolted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  🔩 {sector.bolted ? "Equipado" : "Trad / mixto"}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
                  sector.shade === "full" ? "bg-blue-100 text-blue-800"
                    : sector.shade === "partial" ? "bg-sky-100 text-sky-800"
                    : "bg-orange-100 text-orange-800"
                }`}>
                  ☀️ {sector.shade === "full" ? "Sombra total" : sector.shade === "partial" ? "Semisombra" : "Sol directo"}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
                  sector.water_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  💧 {sector.water_available ? "Agua disponible" : "Sin agua"}
                </span>
              </div>
            </div>

            {/* Tabla de rutas */}
            <div className="glass-card rounded-2xl p-6 shadow-sm fade-up fade-up-4">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-5">
                Rutas — {routes.length} en total
              </p>

              {routes.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No hay rutas registradas para este sector.
                </p>
              ) : (
                <div className="space-y-1">
                  {/* Header tabla */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-4 pb-2 border-b border-gray-100">
                    {["Nombre", "Grado", "Largo", "Descripción"].map(h => (
                      <p key={h} className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{h}</p>
                    ))}
                  </div>

                  {/* Filas de rutas */}
                  {routes.map((route, i) => (
                    <div
                      key={route.id}
                      className="route-row grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-4 py-3 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-300 font-mono w-5 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="font-medium text-gray-900 text-sm">{route.name}</p>
                      </div>
                      <div className="self-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${gradeColor(route.grade)}`}>
                          {route.grade}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 self-center">
                        {route.length ? `${route.length} m` : "—"}
                      </p>
                      <p className="text-sm text-gray-400 self-center truncate">
                        {route.description || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ClimbingSectorDetails