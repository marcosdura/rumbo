"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "../../../components/layout/Navbar"
import LoadingScreen from "@/components/ui/LoadingScreen"
import FavoriteButton from "@/components/spot-detail/FavoriteButton"
import TrekkingRouteCard from "@/components/spot-detail/TrekkingRouteCard"
import TrekkingAmenitiesCard from "@/components/spot-detail/TrekkingAmenitiesCard"
import { formatStat } from "@/lib/formatStat"


function TrekkingRouteDetails({ slug: slugProp, trekkingDetail = null } = {}) {
  const params = useParams()
  const id = params?.id
  const router = useRouter()
  const [route, setRoute] = useState(null)

  useEffect(() => {
    const url = slugProp
      ? `${process.env.NEXT_PUBLIC_API_URL}/routes/by-slug/${slugProp}`
      : `${process.env.NEXT_PUBLIC_API_URL}/routes/${id}`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log(data)
        setRoute(data)
      })
  }, [slugProp, id])

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!route) return <LoadingScreen />

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

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .altitude-grid {
            grid-template-columns: 1fr !important;
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
          .action-buttons {
            width: 100%;
          }
        }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="page-content" style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px 64px" }}>

          {/* Back */}
          <button className="back-btn fade-up fade-up-1" onClick={() => router.back()}>
            ← Volver {route.spot?.name}
          </button>

          {/* Header */}
          <div className="fade-up fade-up-1 header-row" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                  Ruta de Trekking
                </p>
              </div>
              <h1 className="spot-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
                {route.name}
              </h1>
            </div>
            <div className="action-buttons" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="action-btn">🔗 Compartir</button>
            </div>
          </div>

          {/* Stats principales */}
          <div className="fade-up fade-up-2 stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { icon: "📏", val: formatStat(route.distance_km, " km"),      lbl: "Distancia" },
              { icon: "⏱️", val: formatStat(route.duration_hours, " h"),    lbl: "Duración" },
              { icon: "↑",  val: formatStat(route.elevation_gain, " m"),    lbl: "Desnivel +" },
              { icon: "↓",  val: formatStat(route.elevation_loss, " m"),    lbl: "Desnivel −" },
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

          {/* Altitudes */}
          <div className="fade-up fade-up-2 altitude-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { icon: "⛰️", val: formatStat(route.max_altitude, " m"), lbl: "Altitud máxima" },
              { icon: "🏕️", val: formatStat(route.min_altitude, " m"), lbl: "Altitud mínima" },
            ].map(({ icon, val, lbl }) => (
              <div key={lbl} style={{
                background: "#fff", border: "1px solid #e0ddd6",
                borderRadius: 16, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <span style={{ fontSize: 28 }}>{icon}</span>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px" }}>{val}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{lbl}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Características de la ruta */}
          <div className="fade-up fade-up-3" style={{ marginBottom: 20 }}>
            <TrekkingRouteCard route={route} />
          </div>

          {/* Características del lugar */}
          {trekkingDetail && (
            <div className="fade-up fade-up-3" style={{ marginBottom: 20 }}>
              <TrekkingAmenitiesCard trekkingDetail={trekkingDetail} />
            </div>
          )}

          {/* Descripción */}
          {route.description && (
            <div className="fade-up fade-up-4" style={{
              background: "#fff", border: "1px solid #e0ddd6",
              borderRadius: 20, padding: "24px 28px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
                  Descripción
                </p>
              </div>
              <p style={{ fontSize: 14, color: "#3d3d3a", lineHeight: 1.7, margin: 0 }}>
                {route.description}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default TrekkingRouteDetails