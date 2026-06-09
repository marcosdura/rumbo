"use client"

const difficultyStyle = {
  "fácil":      { color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8", dot: "🟢" },
  "moderado":   { color: "#78590a", bg: "#fef9e7", border: "#f0d98a", dot: "🟡" },
  "difícil":    { color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0", dot: "🔴" },
}

const levelStyle = {
  "bajo":  { color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" },
  "medio": { color: "#78590a", bg: "#fef9e7", border: "#f0d98a" },
  "alto":  { color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" },
}

const neutral = { color: "#4a443b", bg: "#f7f5f0", border: "#e0ddd6" }

function Badge({ label, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 999,
      fontSize: 12, fontWeight: 600,
      color: style.color, background: style.bg, border: `1px solid ${style.border}`,
    }}>
      {label}
    </span>
  )
}

export default function TrekkingRouteCard({ route }) {
  if (!route) return null

  const diff = difficultyStyle[route.difficulty]
  const tech = levelStyle[route.technical_level]
  const phys = levelStyle[route.physical_demand]

  const items = []

  if (diff) items.push({ label: `${diff.dot} ${route.difficulty?.charAt(0).toUpperCase() + route.difficulty?.slice(1)}`, style: diff })
  else if (route.difficulty) items.push({ label: route.difficulty, style: neutral })

  if (route.route_type) items.push({
    label: `${route.route_type === "circular" ? "🔁" : "↩️"} ${route.route_type}`,
    style: neutral,
  })

  if (tech) items.push({ label: `🧗 Técnico: ${route.technical_level}`, style: tech })
  else if (route.technical_level) items.push({ label: `🧗 Técnico: ${route.technical_level}`, style: neutral })

  if (phys) items.push({ label: `💪 Físico: ${route.physical_demand}`, style: phys })
  else if (route.physical_demand) items.push({ label: `💪 Físico: ${route.physical_demand}`, style: neutral })

  if (items.length === 0) return null

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Características de la ruta
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => <Badge key={i} label={item.label} style={item.style} />)}
      </div>
    </div>
  )
}
