"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface Experience {
  id: number
  title: string
  description: string | null
  price: number | null
  currency: string
  schedule: string | null
  contact: string | null
  category: { id: number; name: string } | null
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Trekking:  "🥾",
  Escalada:  "🧗",
  Surf:      "🏄",
  Kayak:     "🛶",
  Cabalgatas: "🐴",
  Pesca:     "🎣",
}

export default function ExperienciasSection({ spotId }: { spotId: number }) {
  const [experiences, setExperiences] = useState<Experience[]>([])

  useEffect(() => {
    api.get<Experience[]>(`/spots/${spotId}/experiences`)
      .then(({ data }) => setExperiences(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [spotId])

  if (experiences.length === 0) return null

  return (
    <div className="amenities-card">
      <style>{`
        .exp-card {
          background: #f7f5f0;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        @media (hover: hover) {
          .exp-card:hover {
            background: #f0f7f3;
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(0,0,0,0.07);
          }
        }
      `}</style>

      <div className="amenities-label">
        <div className="amenities-dot" />
        <p className="amenities-title">🌿 Experiencias disponibles</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {experiences.map(exp => (
          <div key={exp.id} className="exp-card">

            {/* Fila superior: categoria + titulo + precio */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: exp.description || exp.schedule || exp.contact ? 8 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {exp.category && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    background: "#e8f5ee", color: "var(--primary-dark)", border: "1px solid #b7dfc8",
                    flexShrink: 0,
                  }}>
                    {CATEGORY_EMOJIS[exp.category.name] ?? ""} {exp.category.name}
                  </span>
                )}
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                  {exp.title}
                </p>
              </div>
              {exp.price != null && (
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", margin: 0, flexShrink: 0 }}>
                  {exp.price === 0 ? (
                    "Gratis"
                  ) : (
                    <>
                      ${exp.price}{" "}
                      <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)" }}>{exp.currency}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Descripción */}
            {exp.description && (
              <p style={{ fontSize: 13, color: "#4a4a46", margin: "0 0 8px", lineHeight: 1.6 }}>
                {exp.description}
              </p>
            )}

            {/* Footer: horario + contacto */}
            {(exp.schedule || exp.contact) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                {exp.schedule && (
                  <span style={{ fontSize: 12, color: "var(--muted-strong)", display: "flex", alignItems: "center", gap: 4 }}>
                    🗓️ {exp.schedule}
                  </span>
                )}
                {exp.contact && (
                  <span style={{ fontSize: 12, color: "var(--muted-strong)", display: "flex", alignItems: "center", gap: 4 }}>
                    📞 {exp.contact}
                  </span>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* CTA contacto */}
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "14px 0 0", lineHeight: 1.5 }}>
        Para más información sobre horarios, disponibilidad o reservas, contactá directamente al lugar.
      </p>
    </div>
  )
}
