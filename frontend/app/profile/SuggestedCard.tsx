"use client"

import Link from "next/link"
import Pill from "@/components/ui/Pill"
import { s } from "./styles"
import { ctaLink } from "./MySpotsCard"

// GET /me/suggested: los lugares que cargaste como visitante.
export type SuggestedSpot = {
  id: number
  name: string
  slug: string | null
  category: string | null
  department: string | null
  status: "pending" | "approved" | "rejected"
  rejection_reason: string | null
  image: string | null
}

const STATUS_PILL = {
  pending: { variant: "yellow", label: "En revisión" },
  approved: { variant: "green", label: "Publicado" },
  rejected: { variant: "red", label: "Rechazado" },
} as const

// "Los que sugeriste": mientras se revisan los manejás vos (por ejemplo,
// para corregirlos si los rechazan); publicados, pasan a Rumbo y quedan acá
// con su link.
export default function SuggestedCard({ spots }: { spots: SuggestedSpot[] }) {
  if (spots.length === 0) return null
  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          Los que sugeriste
        </p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>
        Los cargaste como visitante: una vez publicados los administra Rumbo.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {spots.map(spot => {
          const pill = STATUS_PILL[spot.status]
          return (
            <div key={spot.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f7f5f0" }}>
                {spot.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura de Cloudinary, igual que en Tus lugares
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_96,h_96,c_fill/${spot.image}`}
                    alt={spot.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎒</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {spot.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Pill variant={pill.variant} size="sm">{pill.label}</Pill>
                  {(spot.category || spot.department) && (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{[spot.category, spot.department].filter(Boolean).join(" · ")}</span>
                  )}
                </div>
                {spot.status === "rejected" && spot.rejection_reason && (
                  <p style={{ fontSize: 12, color: "#7c1d1d", margin: "6px 0 0", lineHeight: 1.5 }}>Motivo: {spot.rejection_reason}</p>
                )}
              </div>
              {spot.status === "approved" && spot.slug ? (
                <Link href={`/spots/${spot.slug}`} style={{ ...ctaLink, flexShrink: 0 }}>Ver →</Link>
              ) : (
                <Link href={`/dashboard/spots/${spot.id}`} style={{ ...ctaLink, flexShrink: 0 }}>Administrar →</Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
