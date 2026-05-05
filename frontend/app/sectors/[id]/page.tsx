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

  const gradeConfig = (grade) => {
    if (!grade) return { color: "#9a9690", bg: "#f7f5f0", border: "#e0ddd6" }
    const g = grade.toLowerCase()
    if (g.startsWith("v")) {
      const num = parseInt(g.slice(1))
      if (num <= 3) return { color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" }
      if (num <= 6) return { color: "#78590a", bg: "#fef9e7", border: "#f0d98a" }
      if (num <= 9) return { color: "#7c3a0a", bg: "#fff4e6", border: "#f5c97a" }
      return { color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" }
    }
    const num = parseFloat(g)
    if (num <= 5) return { color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" }
    if (num <= 6) return { color: "#78590a", bg: "#fef9e7", border: "#f0d98a" }
    if (num <= 7) return { color: "#7c3a0a", bg: "#fff4e6", border: "#f5c97a" }
    return { color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!sector) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
        <Navbar />
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px", width: "100%" }}>
          <style>{`
            @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
          `}</style>
          <div style={{ height: 32, background: "#ede9e1", borderRadius: 10, width: "30%", marginBottom: 16, animation: "pulse 1.5s infinite" }} />
          <div style={{ height: 18, background: "#ede9e1", borderRadius: 8, width: "20%", marginBottom: 36, animation: "pulse 1.5s infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 110, background: "#ede9e1", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const badges = [
    {
      icon: "🪨", label: sector.rock_type,
      color: "#4a443b", bg: "#f7f5f0", border: "#e0ddd6",
    },
    {
      icon: "🔩",
      label: sector.bolted ? "Equipado" : "Trad / mixto",
      color: sector.bolted ? "#1b4332" : "#78590a",
      bg: sector.bolted ? "#e8f5ee" : "#fef9e7",
      border: sector.bolted ? "#b7dfc8" : "#f0d98a",
    },
    {
      icon: "☀️",
      label: sector.shade === "full" ? "Sombra total" : sector.shade === "partial" ? "Semisombra" : "Sol directo",
      color: sector.shade === "full" ? "#1b4332" : sector.shade === "partial" ? "#2d6a4f" : "#7c4a03",
      bg: sector.shade === "full" ? "#e8f5ee" : sector.shade === "partial" ? "#f0f7f3" : "#fff4e6",
      border: sector.shade === "full" ? "#b7dfc8" : sector.shade === "partial" ? "#c0ddd0" : "#f5c97a",
    },
    {
      icon: "💧",
      label: sector.water_available ? "Agua disponible" : "Sin agua",
      color: sector.water_available ? "#1b4332" : "#7c1d1d",
      bg: sector.water_available ? "#e8f5ee" : "#fdf0f0",
      border: sector.water_available ? "#b7dfc8" : "#f5c0c0",
    },
  ]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fade-up   { opacity: 0; transform: translateY(16px); animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        .fade-up-4 { animation-delay: 0.35s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 500; color: #9a9690;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
          padding: 0; margin-bottom: 24px;
        }
        .back-btn:hover { color: #1b1b19; }

        .action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid #e0ddd6; background: #fff;
          color: #3d3d3a; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .action-btn:hover { background: #f7f5f0; transform: translateY(-1px); }

        .route-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 12px;
          transition: background 0.15s;
          align-items: center;
        }
        .route-row:hover { background: #f7f5f0; }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px 64px" }}>

          {/* Back */}
          <button className="back-btn fade-up fade-up-1" onClick={() => router.back()}>
            ← Volver
          </button>

          {/* Header */}
          <div className="fade-up fade-up-1" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                  Sector de Escalada
                </p>
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
                {sector.name}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="action-btn">⭐ Guardar</button>
              <button className="action-btn">🔗 Compartir</button>
            </div>
          </div>

          {/* Stats */}
          <div className="fade-up fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { icon: "📍", val: `${sector.routes_count} rutas`, lbl: "Total rutas" },
              { icon: "🎯", val: `${sector.min_grade} – ${sector.max_grade}`, lbl: "Graduación" },
              { icon: "⛰️", val: `${sector.altitude} m`, lbl: "Altitud" },
              { icon: "🧭", val: sector.orientation, lbl: "Orientación" },
            ].map(({ icon, val, lbl }) => (
              <div key={lbl} style={{
                background: "#fff", border: "1px solid #e0ddd6",
                borderRadius: 16, padding: "20px 16px",
                textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <p style={{ fontSize: 24, marginBottom: 6 }}>{icon}</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>{val}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{lbl}</p>
              </div>
            ))}
          </div>

          {/* Características */}
          <div className="fade-up fade-up-3" style={{
            background: "#fff", border: "1px solid #e0ddd6",
            borderRadius: 20, padding: "24px 28px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                Características
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {badges.map((b, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 999,
                  fontSize: 12, fontWeight: 600,
                  color: b.color, background: b.bg, border: `1px solid ${b.border}`,
                }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Tabla de rutas */}
          <div className="fade-up fade-up-4" style={{
            background: "#fff", border: "1px solid #e0ddd6",
            borderRadius: 20, padding: "24px 28px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                Rutas — {routes.length} en total
              </p>
            </div>

            {routes.length === 0 ? (
              <p style={{ fontSize: 14, color: "#9a9690", textAlign: "center", padding: "32px 0" }}>
                No hay rutas registradas para este sector.
              </p>
            ) : (
              <div>
                {/* Header tabla */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr",
                  gap: 16, padding: "0 16px 10px",
                  borderBottom: "1px solid #ede9e1", marginBottom: 4,
                }}>
                  {["Nombre", "Grado", "Largo", "Descripción"].map(h => (
                    <p key={h} style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9690", margin: 0 }}>
                      {h}
                    </p>
                  ))}
                </div>

                {/* Filas */}
                {routes.map((route, i) => {
                  const gc = gradeConfig(route.grade)
                  return (
                    <div key={route.id} className="route-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "#d0cdc7", fontFamily: "monospace", width: 20, flexShrink: 0 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{route.name}</p>
                      </div>
                      <div>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px", borderRadius: 999,
                          fontSize: 12, fontWeight: 600,
                          color: gc.color, background: gc.bg, border: `1px solid ${gc.border}`,
                        }}>
                          {route.grade}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0 }}>
                        {route.length ? `${route.length} m` : "—"}
                      </p>
                      <p style={{ fontSize: 13, color: "#9a9690", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {route.description || "—"}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ClimbingSectorDetails