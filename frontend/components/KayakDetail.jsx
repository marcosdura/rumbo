export default function KayakDetail({ kayak }) {
  if (!kayak) return null

  const waterTypeLabel = {
    rio: { label: "Río", icon: "🏞️" },
    lago: { label: "Lago", icon: "🌊" },
    mar: { label: "Mar", icon: "🌊" },
  }

  const difficultyConfig = {
    facil:       { label: "Fácil",       color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" },
    intermedio:  { label: "Intermedio",  color: "#78590a", bg: "#fef9e7", border: "#f0d98a" },
    dificil:     { label: "Difícil",     color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" },
  }

  const kayakTypeLabel = {
    travesia:   "Travesía",
    recreativo: "Recreativo",
    rapido:     "Aguas Rápidas",
  }

  const diff  = difficultyConfig[kayak.difficulty] || { label: kayak.difficulty, color: "#9a9690", bg: "#f7f5f0", border: "#e0ddd6" }
  const water = waterTypeLabel[kayak.water_type]   || { label: kayak.water_type, icon: "💧" }

  const rows = [
    {
      icon: water.icon,
      label: "Tipo de agua",
      value: water.label,
      badge: false,
    },
    {
      icon: "📊",
      label: "Dificultad",
      value: diff.label,
      badge: true,
      badgeStyle: { color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` },
    },
    {
      icon: "⏱️",
      label: "Duración",
      value: `${kayak.duration} ${kayak.duration === 1 ? "hora" : "horas"}`,
      badge: false,
    },
    {
      icon: "🛶",
      label: "Tipo de kayak",
      value: kayakTypeLabel[kayak.kayak_type] || kayak.kayak_type,
      badge: false,
    },
    {
      icon: "🏪",
      label: "Alquiler disponible",
      value: kayak.rental_available ? "Disponible" : "No disponible",
      badge: true,
      badgeStyle: kayak.rental_available
        ? { color: "#1b4332", background: "#e8f5ee", border: "1px solid #b7dfc8" }
        : { color: "#9a9690", background: "#f7f5f0", border: "1px solid #e0ddd6" },
    },
  ]

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
          Detalles del Kayak
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 10px",
              borderTop: i === 0 ? "1px solid #ede9e1" : "none",
              borderBottom: "1px solid #ede9e1",
              transition: "background 0.15s",
              borderRadius: 0,
              cursor: "default",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f7f5f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#7a7669" }}>
              <span style={{ fontSize: 16 }}>{row.icon}</span>
              {row.label}
            </span>

            {row.badge ? (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "4px 10px", borderRadius: 999,
                ...row.badgeStyle,
              }}>
                {row.value}
              </span>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>
                {row.value}
              </span>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}