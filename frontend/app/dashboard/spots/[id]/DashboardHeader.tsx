// El encabezado del panel del dueño: volver al perfil, el nombre con su
// estado, y el link a la página del lugar (o a la vista previa si todavía no
// está publicado: la página pública daba 404). Debajo, sus números.
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import { s } from "./styles"
import type { Spot } from "./types"

const linkButton = { padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", background: "#fff", color: "#3d3d3a", textDecoration: "none" } as const

export function DashboardHeader({ spot }: { spot: Spot }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Link href="/profile" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
        ← Volver al perfil
      </Link>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 26, fontWeight: 700, color: "#1b1b19", margin: "0 0 6px" }}>
            {spot.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Pill variant={spot.is_approved ? "green" : spot.rejected_at ? "red" : "yellow"} size="sm">
              {spot.is_approved ? "✓ Publicado" : spot.rejected_at ? "✕ Rechazado" : "⏳ En revisión"}
            </Pill>
            {spot.category && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{spot.category.name} · {spot.department}</span>
            )}
          </div>
        </div>
        {spot.slug && spot.is_approved ? (
          <a href={`/spots/${spot.slug}`} target="_blank" rel="noopener noreferrer" style={linkButton}>Ver lugar →</a>
        ) : (
          <a href={`/dashboard/spots/${spot.id}/vista-previa`} target="_blank" rel="noopener noreferrer" style={linkButton}>Vista previa →</a>
        )}
      </div>
    </div>
  )
}

// Visitas (últimos 30 días) y favoritos son un extra: sin ellos el panel anda igual.
export function OwnerStats({ spot, stats }: { spot: Spot; stats: { views_30d: number; favorites: number } | null }) {
  const items = [
    ...(stats ? [
      { label: "Visitas (30 días)", value: stats.views_30d, emoji: "👀" },
      { label: "En favoritos", value: stats.favorites, emoji: "❤️" },
    ] : []),
    { label: "Reseñas", value: spot.review_count ?? 0, emoji: "💬" },
    { label: "Calificación", value: spot.average_rating ? `${spot.average_rating} ★` : "—", emoji: "⭐" },
  ]
  return (
    <div className="owner-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
      {items.map(stat => (
        <div key={stat.label} style={{ ...s.card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f7f5f0", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {stat.emoji}
          </div>
          <div>
            <p style={{ fontSize: 22, fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, color: "#1b1b19", margin: "0 0 2px", lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
