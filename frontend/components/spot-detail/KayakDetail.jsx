import { useState } from "react"
import Pill from "@/components/ui/Pill"

export default function KayakDetail({ kayaks }) {
  const [copiedId, setCopiedId] = useState(null)

  if (!kayaks?.length) return null

  const waterTypeLabel = {
    rio:  { label: "Río",  icon: "🏞️" },
    lago: { label: "Lago", icon: "🌊" },
    mar:  { label: "Mar",  icon: "🌊" },
  }

  const difficultyConfig = {
    facil:      { label: "Fácil",      color: "#1b4332", bg: "#e8f5ee", border: "#b7dfc8" },
    intermedio: { label: "Intermedio", color: "#78590a", bg: "#fef9e7", border: "#f0d98a" },
    dificil:    { label: "Difícil",    color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" },
  }

  const kayakTypeLabel = {
    travesia:   "Travesía",
    recreativo: "Recreativo",
    rapido:     "Aguas Rápidas",
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
          Alquiler de Kayaks
        </p>
      </div>

      {/* Grid de cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {kayaks.map((kayak) => {
          const diff  = difficultyConfig[kayak.difficulty] || { label: kayak.difficulty, color: "#9a9690", bg: "#f7f5f0", border: "#e0ddd6" }
          const water = waterTypeLabel[kayak.water_type]   || { label: kayak.water_type, icon: "💧" }
          const hasContact = kayak.email || kayak.whatsapp || kayak.instagram
          const whatsappUrl = kayak.whatsapp ? `https://wa.me/${kayak.whatsapp.replace(/\D/g, "")}` : null
          const instagramHandle = kayak.instagram ? kayak.instagram.replace(/^@/, "") : null
          const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null

          return (
            <div
              key={kayak.id}
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
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                🛶 {kayak.name}
              </p>

              {/* Badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {kayak.water_type && (
                  <Pill variant="neutral">{water.icon} {water.label}</Pill>
                )}
                {kayak.difficulty && (
                  <Pill bg={diff.bg} color={diff.color} border={diff.border}>
                    📊 {diff.label}
                  </Pill>
                )}
                {kayak.duration != null && (
                  <Pill variant="neutral">
                    ⏱️ {kayak.duration} {kayak.duration === 1 ? "hora" : "horas"}
                  </Pill>
                )}
                {kayak.kayak_type && (
                  <Pill variant="neutral">
                    🛶 {kayakTypeLabel[kayak.kayak_type] || kayak.kayak_type}
                  </Pill>
                )}
                {kayak.rental_available != null && (
                  <Pill variant={kayak.rental_available ? "green" : "muted"}>
                    🏪 {kayak.rental_available ? "Alquiler disponible" : "Sin alquiler"}
                  </Pill>
                )}
              </div>

              {/* Contacto */}
              {hasContact && (
                <div style={{ borderTop: "1px solid #ede9e1", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a9690", margin: 0 }}>
                    Contacto
                  </p>

                  {kayak.email && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669", display: "flex", alignItems: "center", gap: 6 }}>
                        ✉️ Email
                      </span>
                      <span
                        onClick={() => handleCopy(kayak.email, kayak.id)}
                        style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", cursor: "pointer" }}
                        title="Copiar email"
                      >
                        {copiedId === kayak.id ? "¡Copiado! ✓" : kayak.email}
                      </span>
                    </div>
                  )}

                  {kayak.whatsapp && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669", display: "flex", alignItems: "center", gap: 6 }}>
                        💬 WhatsApp
                      </span>
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        {kayak.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                      </a>
                    </div>
                  )}

                  {kayak.instagram && (
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