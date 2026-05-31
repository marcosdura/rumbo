"use client"
import { useState } from "react"
import Link from "next/link"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"

const difficultyConfig = {
  "fácil":      { label: "Fácil",      color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8", dot: "🟢" },
  "intermedio": { label: "Intermedio", color: "#78590a", bg: "#fef9e7", border: "#f0d98a", dot: "🟡" },
  "difícil":    { label: "Difícil",    color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0", dot: "🔴" },
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

export default function RouteCard({ route, spotSlug }) {
  const [hovered, setHovered] = useState(false)
  const diff = difficultyConfig[route.difficulty] || { label: route.difficulty, color: "#9a9690", bg: "#f7f5f0", border: "#e0ddd6", dot: "⚪" }
  const href = spotSlug && route.slug
    ? `/spots/${spotSlug}/rutas/${route.slug}`
    : `/trekkingRoute/${route.id}`

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="route-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="route-card-header">
          <h3 className="route-card-title">{route.name}</h3>
          <CircleArrow active={hovered} />
        </div>

        <div className="route-stats-grid">
          {[
            { val: `${route.distance_km} km`, lbl: "Distancia" },
            { val: `${route.duration_hours} h`, lbl: "Duración" },
            { val: `↑ ${route.elevation_gain} m`, lbl: "Desnivel +" },
            { val: `↓ ${route.elevation_loss} m`, lbl: "Desnivel −" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="route-stat-cell">
              <p className="route-stat-val">{val}</p>
              <p className="route-stat-lbl">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="route-alt-row">
          {[
            { icon: "⛰️", val: `${route.max_altitude} m`, lbl: "Altitud máx." },
            { icon: "🏕️", val: `${route.min_altitude} m`, lbl: "Altitud mín." },
          ].map(({ icon, val, lbl }) => (
            <div key={lbl} className="route-alt-cell">
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div style={{ textAlign: "center" }}>
                <p className="route-stat-val">{val}</p>
                <p className="route-stat-lbl">{lbl}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="route-badges">
          <Pill bg={diff.bg} color={diff.color} border={diff.border}>
            {diff.dot} {diff.label}
          </Pill>
          <Pill {...neutralBadge(`${route.route_type === "circular" ? "🔁" : "↩️"} ${route.route_type}`)} />
          <Pill {...boolBadge(route.water_available, "💧 Agua", "💧 Sin agua")} />
          <Pill {...boolBadge(route.camping_allowed, "⛺ Camping", "⛺ Sin camping")} />
        </div>
      </div>
    </Link>
  )
}
