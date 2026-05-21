import { useState } from "react"
import Pill from "@/components/ui/Pill"

export default function SurfSchoolDetail({ surfSchools }) {
  const [copiedId, setCopiedId] = useState(null)

  if (!surfSchools?.length) return null

  const classTypeConfig = {
    grupal:    { label: "Grupal",    icon: "👥" },
    privada:   { label: "Privada",   icon: "🧑" },
    intensivo: { label: "Intensivo", icon: "🔥" },
  }

  const handleCopy = (email, id) => {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Escuelas de Surf
        </p>
      </div>

      {/* Grid de cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {surfSchools.map((school) => {
          const classInfo = classTypeConfig[school.class_type] || { label: school.class_type, icon: "🏄" }
          const hasContact = school.email || school.whatsapp || school.instagram
          const whatsappUrl = school.whatsapp ? `https://wa.me/${school.whatsapp.replace(/\D/g, "")}` : null
          const instagramHandle = school.instagram ? school.instagram.replace(/^@/, "") : null
          const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null

          return (
            <div
              key={school.id}
              style={{
                background: "#fff",
                border: "1px solid #e0ddd6",
                borderRadius: 20,
                padding: "22px 24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Nombre */}
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                  🏄 {school.name}
                </p>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {school.class_type && (
                  <Pill variant="green">{classInfo.icon} {classInfo.label}</Pill>
                )}
                {school.duration != null && (
                  <Pill variant="neutral">
                    ⏱️ {school.duration} {school.duration === 1 ? "hora" : "horas"}
                  </Pill>
                )}
                {school.equipment_include != null && (
                  <Pill variant={school.equipment_include ? "green" : "muted"}>
                    🩳 {school.equipment_include ? "Equipo incluido" : "Sin equipo"}
                  </Pill>
                )}
              </div>

              {/* Contacto */}
              {hasContact && (
                <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a9690", margin: 0 }}>
                    Contacto
                  </p>

                  {school.email && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669", display: "flex", alignItems: "center", gap: 6 }}>
                        ✉️ Email
                      </span>
                      <span
                        onClick={() => handleCopy(school.email, school.id)}
                        style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", cursor: "pointer" }}
                        title="Copiar email"
                      >
                        {copiedId === school.id ? "¡Copiado! ✓" : school.email}
                      </span>
                    </div>
                  )}

                  {school.whatsapp && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669", display: "flex", alignItems: "center", gap: 6 }}>
                        💬 WhatsApp
                      </span>
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        {school.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                      </a>
                    </div>
                  )}

                  {school.instagram && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669", display: "flex", alignItems: "center", gap: 6 }}>
                        📷 Instagram
                      </span>
                      <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        @{instagramHandle} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}