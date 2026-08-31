"use client"

import Link from "next/link"
import Pill from "@/components/ui/Pill"
import { s } from "./styles"

interface Props {
  mySpots: any[]
}

export default function MySpotsCard({ mySpots }: Props) {
  if (mySpots.length === 0) return null

  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          Tus lugares
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mySpots.map(spot => {
          const main = spot.images?.find((i: any) => i.is_main) || spot.images?.[0]
          return (
            <div key={spot.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #ede9e1" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f7f5f0" }}>
                {main ? (
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_96,h_96,c_fill/${main.cloudinary_public_id}`}
                    alt={spot.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏕️</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {spot.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Pill variant={spot.is_approved ? "green" : "yellow"} size="sm">
                    {spot.is_approved ? "Aprobado" : "Pendiente"}
                  </Pill>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    ⭐ {spot.review_count ?? 0} reseña{spot.review_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Link
                href={`/dashboard/spots/${spot.id}`}
                style={{
                  padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: "#f7f5f0", border: "1px solid var(--border)", color: "#3d3d3a",
                  textDecoration: "none", flexShrink: 0,
                }}
              >
                Administrar →
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
