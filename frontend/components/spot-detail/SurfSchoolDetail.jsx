"use client"

import { useState } from "react"
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import CircleArrow from "@/components/ui/CircleArrow"

const classTypeConfig = {
  grupal:    { label: "Grupal",    icon: "👥" },
  privada:   { label: "Privada",   icon: "🧑" },
  intensivo: { label: "Intensivo", icon: "🔥" },
}

function SchoolCard({ school, copiedId, onCopy }) {
  const [hovered, setHovered] = useState(false)

  const classInfo = classTypeConfig[school.class_type] || { label: school.class_type, icon: "🏄" }
  const hasContact = school.email || school.whatsapp || school.instagram
  const whatsappUrl = school.whatsapp ? `https://wa.me/${school.whatsapp.replace(/\D/g, "")}` : null
  const instagramHandle = school.instagram ? school.instagram.replace(/^@/, "") : null
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null

  return (
    <Link
      href={`/surf/${school.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="surf-school-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Foto de portada */}
        {school.photo_1 && (
          <div style={{ position: "relative", height: 160, flexShrink: 0, overflow: "hidden" }}>
            <img
              src={school.photo_1}
              alt={school.name}
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
              🏄 {school.name}
            </p>
            <CircleArrow active={hovered} size={28} />
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
                  <span style={{ fontSize: 13, color: "#7a7669" }}>✉️ Email</span>
                  <span
                    onClick={(e) => { e.preventDefault(); onCopy(school.email, school.id) }}
                    style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", cursor: "pointer" }}
                    title="Copiar email"
                  >
                    {copiedId === school.id ? "¡Copiado! ✓" : school.email}
                  </span>
                </div>
              )}

              {school.whatsapp && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#7a7669" }}>💬 WhatsApp</span>
                  <span
                    onClick={(e) => { e.preventDefault(); window.open(whatsappUrl, "_blank", "noopener,noreferrer") }}
                    style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {school.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                  </span>
                </div>
              )}

              {school.instagram && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#7a7669" }}>📷 Instagram</span>
                  <span
                    onClick={(e) => { e.preventDefault(); window.open(instagramUrl, "_blank", "noopener,noreferrer") }}
                    style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
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

export default function SurfSchoolDetail({ surfSchools }) {
  const [copiedId, setCopiedId] = useState(null)

  if (!surfSchools?.length) return null

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
      <style>{`
        .surf-school-card {
          background: #fff;
          border: 1px solid #e0ddd6;
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
          .surf-school-card:hover {
            box-shadow: 0 6px 24px rgba(0,0,0,0.09);
            transform: translateY(-2px);
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Escuelas de Surf
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {surfSchools.map((school) => (
          <SchoolCard
            key={school.id}
            school={school}
            copiedId={copiedId}
            onCopy={handleCopy}
          />
        ))}
      </div>
    </div>
  )
}
