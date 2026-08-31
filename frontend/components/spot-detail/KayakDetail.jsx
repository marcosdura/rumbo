"use client"

import { useState } from "react"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import CircleArrow from "@/components/ui/CircleArrow"
import { slugWithId } from "@/lib/slugify"

const waterTypeLabel = {
  rio:  { label: "Río",  icon: "🏞️" },
  lago: { label: "Lago", icon: "🌊" },
  mar:  { label: "Mar",  icon: "🌊" },
}

const difficultyConfig = {
  facil:      { label: "Fácil",      color: "var(--primary-dark)", bg: "#e8f5ee", border: "#b7dfc8" },
  intermedio: { label: "Intermedio", color: "#78590a", bg: "#fef9e7", border: "#f0d98a" },
  dificil:    { label: "Difícil",    color: "#7c1d1d", bg: "#fdf0f0", border: "#f5c0c0" },
}

const kayakTypeLabel = {
  travesia:   "Travesía",
  recreativo: "Recreativo",
  rapido:     "Aguas Rápidas",
}

function KayakCard({ kayak, copiedId, onCopy }) {
  const [hovered, setHovered] = useState(false)

  const diff  = difficultyConfig[kayak.difficulty] || { label: kayak.difficulty, color: "var(--muted)", bg: "#f7f5f0", border: "var(--border)" }
  const water = waterTypeLabel[kayak.water_type]   || { label: kayak.water_type, icon: "💧" }
  const hasContact = kayak.email || kayak.whatsapp || kayak.instagram
  const whatsappUrl = kayak.whatsapp ? `https://wa.me/${kayak.whatsapp.replace(/\D/g, "")}` : null
  const instagramHandle = kayak.instagram ? kayak.instagram.replace(/^@/, "") : null
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null

  return (
    <Link
      href={`/kayak/${slugWithId(kayak.name, kayak.id)}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="kayak-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Foto de portada */}
        {kayak.photo_1 && (
          <div style={{ position: "relative", height: 160, flexShrink: 0, overflow: "hidden" }}>
            <img
              src={kayak.photo_1}
              alt={kayak.name}
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
                transform: hovered ? "scale(1.04)" : "scale(1)",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 55%)",
            }} />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "22px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Nombre + CircleArrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
              🛶 {kayak.name}
            </p>
            <CircleArrow active={hovered} size={28} />
          </div>

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
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
                Contacto
              </p>

              {kayak.email && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#7a7669" }}>✉️ Email</span>
                  <span
                    onClick={(e) => { e.preventDefault(); onCopy(kayak.email, kayak.id) }}
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}
                    title="Copiar email"
                  >
                    {copiedId === kayak.id ? "¡Copiado! ✓" : kayak.email}
                  </span>
                </div>
              )}

              {kayak.whatsapp && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#7a7669" }}>💬 WhatsApp</span>
                  <span
                    onClick={(e) => { e.preventDefault(); window.open(whatsappUrl, "_blank", "noopener,noreferrer") }}
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {kayak.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                  </span>
                </div>
              )}

              {kayak.instagram && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#7a7669" }}>📷 Instagram</span>
                  <span
                    onClick={(e) => { e.preventDefault(); window.open(instagramUrl, "_blank", "noopener,noreferrer") }}
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    @{instagramHandle} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Link>
  )
}

export default function KayakDetail({ kayaks }) {
  const [copiedId, setCopiedId] = useState(null)

  if (!kayaks?.length) return null

  const handleCopy = (email, id) => {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        .kayak-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s;
          height: 100%;
          box-sizing: border-box;
        }
        @media (hover: hover) {
          .kayak-card:hover {
            box-shadow: 0 6px 24px rgba(0,0,0,0.09);
            transform: translateY(-2px);
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          Alquiler de Kayaks
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {kayaks.map((kayak) => (
          <KayakCard
            key={kayak.id}
            kayak={kayak}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        ))}
      </div>
    </div>
  )
}
