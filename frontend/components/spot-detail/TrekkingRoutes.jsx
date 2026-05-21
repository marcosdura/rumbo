"use client"
import { useState } from "react"
import Link from "next/link"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"

const difficultyConfig = {
  "fácil":       { label: "Fácil",       color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8", dot: "🟢" },
  "intermedio":  { label: "Intermedio",  color: "#78590a", bg: "#fef9e7", border: "#f0d98a", dot: "🟡" },
  "difícil":     { label: "Difícil",     color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0", dot: "🔴" },
}

const signalConfig = {
  none: { label: "Sin señal",    color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" },
  low:  { label: "Señal baja",   color: "#78590a", bg: "#fef9e7", border: "#f0d98a" },
  mid:  { label: "Señal media",  color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" },
}

const boolBadge = (val, trueLabel, falseLabel) => ({
  label: val ? trueLabel : falseLabel,
  color: val ? "#1b4332" : "#7c1d1d",
  bg:    val ? "#e8f5ee" : "#fdf0f0",
  border: val ? "#b7dfc8" : "#f5c0c0",
})

const neutralBadge = (label) => ({
  label,
  color: "#4a443b",
  bg: "#f7f5f0",
  border: "#e0ddd6",
})

function RouteCard({ route }) {
  const [hovered, setHovered] = useState(false)
  const diff   = difficultyConfig[route.difficulty] || { label: route.difficulty, color: "#9a9690", bg: "#f7f5f0", border: "#e0ddd6", dot: "⚪" }
  const signal = signalConfig[route.signal] || signalConfig.mid

  return (
    <Link href={`/trekkingRoute/${route.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0ddd6",
          borderRadius: 16,
          padding: 20,
          transition: "box-shadow 0.2s, transform 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          setHovered(true)
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)"
          e.currentTarget.style.transform = "translateY(-2px)"
        }}
        onMouseLeave={e => {
          setHovered(false)
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform = "translateY(0)"
        }}
      >

        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 600,
            color: "#1b1b19", margin: 0,
          }}>
            {route.name}
          </h3>
          <CircleArrow active={hovered} />
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { val: `${route.distance_km} km`, lbl: "Distancia" },
            { val: `${route.duration_hours} h`, lbl: "Duración" },
            { val: `↑ ${route.elevation_gain} m`, lbl: "Desnivel +" },
            { val: `↓ ${route.elevation_loss} m`, lbl: "Desnivel −" },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{
              background: "#f7f5f0",
              border: "1px solid #e0ddd6",
              borderRadius: 12,
              padding: "10px 6px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>{val}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.08em", margin: "4px 0 0" }}>{lbl}</p>
            </div>
          ))}
        </div>

        {/* Altitudes */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { icon: "⛰️", val: `${route.max_altitude} m`, lbl: "Altitud máx." },
            { icon: "🏕️", val: `${route.min_altitude} m`, lbl: "Altitud mín." },
          ].map(({ icon, val, lbl }) => (
            <div key={lbl} style={{
              flex: 1,
              background: "#f7f5f0",
              border: "1px solid #e0ddd6",
              borderRadius: 12,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{val}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.08em", margin: "2px 0 0" }}>{lbl}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Pill bg={diff.bg} color={diff.color} border={diff.border}>
            {diff.dot} {diff.label}
          </Pill>
          <Pill {...neutralBadge(`${route.route_type === "circular" ? "🔁" : "↩️"} ${route.route_type}`)} />
          <Pill {...neutralBadge(`🧗 Técnico: ${route.technical_level}`)} />
          <Pill {...neutralBadge(`💪 Físico: ${route.physical_demand}`)} />
          <Pill {...boolBadge(route.water_available, "💧 Agua disponible", "💧 Sin agua")} />
          <Pill {...boolBadge(route.camping_allowed, "⛺ Camping permitido", "⛺ Sin camping")} />
          <Pill bg={signal.bg} color={signal.color} border={signal.border}>
            📶 {signal.label}
          </Pill>
        </div>

      </div>
    </Link>
  )
}

function TrekkingRoutes({ routes }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Rutas de Trekking
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {routes.map(route => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>

    </div>
  )
}

export default TrekkingRoutes