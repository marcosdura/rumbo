export default function SurfSchoolDetail({ surfSchool }) {
  if (!surfSchool) return null

  const classTypeConfig = {
    grupal:    { label: "Grupal",    icon: "👥" },
    privada:   { label: "Privada",   icon: "🧑" },
    intensivo: { label: "Intensivo", icon: "🔥" },
  }

  const classInfo = classTypeConfig[surfSchool.class_type] || {
    label: surfSchool.class_type,
    icon: "🏄",
  }

  const rows = [
    {
      icon: "🏄",
      label: "Escuela",
      value: surfSchool.name,
      badge: false,
    },
    {
      icon: classInfo.icon,
      label: "Tipo de clase",
      value: classInfo.label,
      badge: false,
    },
    {
      icon: "⏱️",
      label: "Duración",
      value: `${surfSchool.duration} ${surfSchool.duration === 1 ? "hora" : "horas"}`,
      badge: false,
    },
    {
      icon: "🩳",
      label: "Equipamiento",
      value: surfSchool.equipment_include ? "Incluido" : "No incluido",
      badge: true,
      badgeStyle: surfSchool.equipment_include
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
          Escuela de Surf
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