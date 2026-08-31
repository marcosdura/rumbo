"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import LoadingScreen from "@/components/ui/LoadingScreen"
import Pill, { type PillVariant } from "@/components/ui/Pill"
import { api } from "@/lib/api"

function ClimbingSectorDetails({ slug: slugProp }: { slug?: string } = {}) {
  const params = useParams()
  const id = params?.id
  const router = useRouter()
  const [sector, setSector] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slugProp && !id) { setError(true); return }
    const path = slugProp ? `/sectors/by-slug/${slugProp}` : `/sectors/${id}`
    api.get<any>(path)
      .then(({ data }) => {
        if (!data || data.detail) { setError(true); return }
        setSector(data)
      })
      .catch(() => setError(true))
  }, [slugProp, id])

  useEffect(() => {
    if (!sector?.id) return
    api.get<any[]>(`/sectors/${sector.id}/routes`)
      .then(({ data }) => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => setRoutes([]))
  }, [sector?.id])

  const gradeVariant = (grade: any): PillVariant => {
    if (!grade) return "muted"
    const g = grade.toLowerCase()
    if (g.startsWith("v")) {
      const num = parseInt(g.slice(1))
      if (num <= 3) return "green"
      if (num <= 6) return "yellow"
      if (num <= 9) return "orange"
      return "red"
    }
    const num = parseFloat(g)
    if (num <= 5) return "green"
    if (num <= 6) return "yellow"
    if (num <= 7) return "orange"
    return "red"
  }

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 36, opacity: 0.2 }}>🧗</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
          Sector no encontrado
        </p>
        <p style={{ fontSize: 14, color: "#9a9690", margin: 0 }}>
          El sector que buscás no existe o fue eliminado.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 8, padding: "10px 20px", borderRadius: 12,
            border: "1px solid #e0ddd6", background: "#fff",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", color: "#3d3d3a",
          }}
        >
          ← Volver
        </button>
      </div>
    </div>
  )

  if (!sector) return <LoadingScreen />

  const badges = [
    sector.type && { icon: "🧗", label: sector.type, variant: "green" as PillVariant },
    sector.restrictions && { icon: "⚠️", label: sector.restrictions, variant: "orange" as PillVariant },
  ].filter(Boolean) as { icon: string; label: string; variant: PillVariant }[]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

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

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .page-content {
            padding: 20px 16px 48px !important;
          }
          .spot-title {
            font-size: 26px !important;
          }
          .header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .route-row {
            grid-template-columns: 2fr 1fr 1fr !important;
          }
          .route-col-largo,
          .route-col-descripcion {
            display: none !important;
          }
          .route-header-largo,
          .route-header-descripcion {
            display: none !important;
          }
        }

        .route-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
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
        <div className="page-content" style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px 64px" }}>

          {/* Back */}
          <button className="back-btn fade-up fade-up-1" onClick={() => router.back()}>
            ← Volver
          </button>

          {/* Header */}
          <div className="fade-up fade-up-1 header-row" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                  Sector de Escalada
                </p>
              </div>
              <h1 className="spot-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
                {sector.name}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="action-btn">🔗 Compartir</button>
            </div>
          </div>

          {/* Stats */}
          <div className="fade-up fade-up-2 stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { icon: "📍", val: `${sector.routes_count} rutas`, lbl: "Total rutas" },
              { icon: "🎯", val: sector.min_grade ? `${sector.min_grade} – ${sector.max_grade}` : "—", lbl: "Graduación" },
              { icon: "⛰️", val: sector.max_altitude ? `${sector.max_altitude} m` : "—", lbl: "Altitud" },
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
          <div className="fade-up fade-up-3 amenities-card" style={{ marginBottom: 20 }}>
            <div className="amenities-label">
              <div className="amenities-dot" />
              <p className="amenities-title">Características</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {badges.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9a9690", margin: 0 }}>Sin características registradas.</p>
              ) : (
                badges.map((b, i) => (
                  <Pill key={i} variant={b.variant} size="lg" hover>
                    {b.icon} {b.label}
                  </Pill>
                ))
              )}
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
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr",
                  gap: 16, padding: "0 16px 10px",
                  borderBottom: "1px solid #ede9e1", marginBottom: 4,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9690", margin: 0 }}>Nombre</p>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9690", margin: 0 }}>Grado</p>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9690", margin: 0 }}>Bolts</p>
                  <p className="route-header-largo" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9690", margin: 0 }}>Largo</p>
                  <p className="route-header-descripcion" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9690", margin: 0 }}>Descripción</p>
                </div>

                {/* Filas */}
                {routes.map((route: any, i: number) => {
                  return (
                    <div key={route.id} className="route-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "#d0cdc7", fontFamily: "monospace", width: 20, flexShrink: 0 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{route.name}</p>
                      </div>
                      <div>
                        <Pill variant={gradeVariant(route.grade)}>{route.grade}</Pill>
                      </div>
                      <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0 }}>{route.bolts ?? "—"}</p>
                      <p className="route-col-largo" style={{ fontSize: 14, color: "#3d3d3a", margin: 0 }}>
                        {route.length ? `${route.length} m` : "—"}
                      </p>
                      <p className="route-col-descripcion" style={{ fontSize: 13, color: "#9a9690", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
