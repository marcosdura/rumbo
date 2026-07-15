"use client"
import { useState } from "react"
import Link from "next/link"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"
import { formatStat } from "@/lib/formatStat"

const difficultyConfig = {
  "fácil":    { label: "Fácil",    variant: "green",  dot: "🟢" },
  "moderado": { label: "Moderado", variant: "yellow", dot: "🟡" },
  "difícil":  { label: "Difícil",  variant: "red",    dot: "🔴" },
}

export default function RouteCard({ route, spotSlug }) {
  const [hovered, setHovered] = useState(false)
  const diff = difficultyConfig[route.difficulty]
    || { label: route.difficulty || "Sin datos", variant: "muted", dot: "⚪" }
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
            { val: formatStat(route.distance_km, " km"), lbl: "Distancia" },
            { val: formatStat(route.duration_hours, " h"), lbl: "Duración" },
            { val: formatStat(route.elevation_gain, " m", "↑ "), lbl: "Desnivel +" },
            { val: formatStat(route.elevation_loss, " m", "↓ "), lbl: "Desnivel −" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="route-stat-cell">
              <p className="route-stat-val">{val}</p>
              <p className="route-stat-lbl">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="route-alt-row">
          {[
            { icon: "⛰️", val: formatStat(route.max_altitude, " m"), lbl: "Altitud máx." },
            { icon: "🏕️", val: formatStat(route.min_altitude, " m"), lbl: "Altitud mín." },
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
          <Pill variant={diff.variant} size="sm">
            {diff.dot} {diff.label}
          </Pill>
          {route.route_type && (
            <Pill variant="neutral" size="sm">
              {route.route_type === "circular" ? "🔁" : "↩️"} {route.route_type}
            </Pill>
          )}
        </div>
      </div>
    </Link>
  )
}
