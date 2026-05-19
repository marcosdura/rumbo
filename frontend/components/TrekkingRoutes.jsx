import Link from "next/link"

function TrekkingRoutes({ routes }) {

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
        {routes.map(route => {
          const diff   = difficultyConfig[route.difficulty] || { label: route.difficulty, color: "#9a9690", bg: "#f7f5f0", border: "#e0ddd6", dot: "⚪" }
          const signal = signalConfig[route.signal] || signalConfig.mid

          return (
            <Link
              key={route.id}
              href={`/trekkingRoute/${route.id}`}
              style={{ textDecoration: "none" }}
            >
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
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={e => {
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
                  <div
                    className="route-arrow"
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      border: "1px solid #e0ddd6", background: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, color: "#9a9690",
                      transition: "background 0.2s, color 0.2s, border-color 0.2s",
                    }}
                  >
                    →
                  </div>
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
                  {/* Dificultad */}
                  <Badge color={diff.color} bg={diff.bg} border={diff.border}>
                    {diff.dot} {diff.label}
                  </Badge>

                  {/* Tipo de ruta */}
                  <Badge {...neutralBadge(`${route.route_type === "circular" ? "🔁" : "↩️"} ${route.route_type}`)} />

                  {/* Técnico */}
                  <Badge {...neutralBadge(`🧗 Técnico: ${route.technical_level}`)} />

                  {/* Físico */}
                  <Badge {...neutralBadge(`💪 Físico: ${route.physical_demand}`)} />

                  {/* Agua */}
                  <Badge {...boolBadge(route.water_available, "💧 Agua disponible", "💧 Sin agua")} />

                  {/* Camping */}
                  <Badge {...boolBadge(route.camping_allowed, "⛺ Camping permitido", "⛺ Sin camping")} />

                  {/* Señal */}
                  <Badge color={signal.color} bg={signal.bg} border={signal.border}>
                    📶 {signal.label}
                  </Badge>
                </div>

              </div>
            </Link>
          )
        })}
      </div>

      <style>{`
        a:hover .route-arrow {
          background: #1b4332 !important;
          color: #fff !important;
          border-color: #1b4332 !important;
        }
      `}</style>

    </div>
  )
}

function Badge({ color, bg, border, children, label }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${border}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children ?? label}
    </span>
  )
}

export default TrekkingRoutes