"use client"

import Pill from "@/components/ui/Pill"

const DIFFICULTY_CONFIG = {
  "fácil":    { variant: "green",  dot: "🟢" },
  "moderado": { variant: "yellow", dot: "🟡" },
  "difícil":  { variant: "red",    dot: "🔴" },
}

const LEVEL_VARIANT = { "bajo": "green", "medio": "yellow", "alto": "red" }

export default function TrekkingRouteCard({ route }) {
  if (!route) return null

  const items = []

  if (route.difficulty) {
    const conf = DIFFICULTY_CONFIG[route.difficulty]
    const label = route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)
    items.push({ variant: conf?.variant || "neutral", label: conf ? `${conf.dot} ${label}` : label })
  }

  if (route.route_type) {
    items.push({ variant: "neutral", label: `${route.route_type === "circular" ? "🔁" : "↩️"} ${route.route_type}` })
  }

  if (route.technical_level) {
    items.push({ variant: LEVEL_VARIANT[route.technical_level] || "neutral", label: `🧗 Técnico: ${route.technical_level}` })
  }

  if (route.physical_demand) {
    items.push({ variant: LEVEL_VARIANT[route.physical_demand] || "neutral", label: `💪 Físico: ${route.physical_demand}` })
  }

  if (items.length === 0) return null

  return (
    <div className="amenities-card">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">Características de la ruta</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => (
          <Pill key={i} variant={item.variant} size="lg" hover>{item.label}</Pill>
        ))}
      </div>
    </div>
  )
}
