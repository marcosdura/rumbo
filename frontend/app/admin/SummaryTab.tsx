"use client"

// La portada del panel (GET /admin/summary): qué hay para revisar, cómo
// viene el sitio y qué contenido falta completar.
import { card } from "@/lib/theme"
import { timeAgo } from "@/lib/notifications"
import type { AdminMode } from "./types"

type Queue = { count: number; oldest: string | null }
type Pair = { current: number; previous: number }
type SpotRef = { id: number; name: string; slug: string | null }
type Missing = { count: number; spots: SpotRef[] }

export type AdminSummary = {
  queues: Record<"new_spots" | "changes" | "contributions" | "reports" | "claims", Queue>
  metrics: Record<"users" | "reviews" | "favorites" | "views" | "new_spots", Pair>
  views_by_day: { day: string; count: number }[]
  top_viewed: (SpotRef & { count: number })[]
  top_favorited: (SpotRef & { count: number })[]
  content_health: Record<"no_photos" | "no_description" | "no_reviews", Missing>
}

// Cada cola y la pestaña donde se resuelve.
export const QUEUES: { key: keyof AdminSummary["queues"]; label: string; tab: AdminMode }[] = [
  { key: "new_spots", label: "Lugares nuevos", tab: "nuevos" },
  { key: "changes", label: "Cambios de lugares", tab: "cambios" },
  { key: "contributions", label: "Aportes de la comunidad", tab: "cambios" },
  { key: "reports", label: "Reportes", tab: "reportes" },
  { key: "claims", label: "Pedidos de responsables", tab: "reclamos" },
]

const METRICS: { key: keyof AdminSummary["metrics"]; label: string }[] = [
  { key: "views", label: "Visitas a lugares" },
  { key: "users", label: "Usuarios nuevos" },
  { key: "reviews", label: "Reseñas" },
  { key: "favorites", label: "Favoritos" },
  { key: "new_spots", label: "Lugares publicados" },
]

const HEALTH: { key: keyof AdminSummary["content_health"]; label: string }[] = [
  { key: "no_photos", label: "Sin fotos" },
  { key: "no_description", label: "Sin descripción" },
  { key: "no_reviews", label: "Sin reseñas" },
]

const sectionTitle = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", margin: "0 0 10px" } as const

// "▲ 12" / "▼ 3" / "= igual" contra los 30 días anteriores.
export function delta({ current, previous }: Pair): { text: string; tone: "up" | "down" | "same" } {
  const diff = current - previous
  if (diff > 0) return { text: `▲ ${diff}`, tone: "up" }
  if (diff < 0) return { text: `▼ ${-diff}`, tone: "down" }
  return { text: "= igual", tone: "same" }
}

const TONE_COLOR = { up: "var(--primary)", down: "var(--danger)", same: "var(--muted)" }

function spotHref(s: SpotRef) {
  return s.slug ? `/spots/${s.slug}` : `/dashboard/spots/${s.id}`
}

function ViewsChart({ days }: { days: AdminSummary["views_by_day"] }) {
  const max = Math.max(1, ...days.map(d => d.count))
  const total = days.reduce((n, d) => n + d.count, 0)
  return (
    <div>
      <div role="img" aria-label={`Visitas por día, últimos 30 días: ${total} en total`} style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
        {days.map(d => (
          <div
            key={d.day}
            title={`${d.day}: ${d.count} visita${d.count !== 1 ? "s" : ""}`}
            style={{ flex: 1, height: `${Math.max(2, (d.count / max) * 100)}%`, background: d.count ? "var(--primary)" : "#e6e1d8", borderRadius: 2 }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        <span>hace 30 días</span><span>hoy</span>
      </div>
    </div>
  )
}

function TopList({ title, items, unit }: { title: string; items: AdminSummary["top_viewed"]; unit: string }) {
  return (
    <div style={{ ...card, padding: 16, flex: "1 1 260px" }}>
      <p style={sectionTitle}>{title}</p>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Todavía no hay datos.</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.9 }}>
          {items.map(s => (
            <li key={s.id}>
              <a href={spotHref(s)} target="_blank" rel="noopener noreferrer" style={{ color: "#1b1b19" }}>{s.name}</a>
              <span style={{ color: "var(--muted)" }}> · {s.count} {unit}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function SummaryTab({ summary, loading, error, onGo, now }: {
  summary: AdminSummary | null
  loading: boolean
  error: string | null
  onGo: (tab: AdminMode) => void
  now?: number
}) {
  if (error) return <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>
  if (loading || !summary) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>

  const pendingTotal = QUEUES.reduce((n, q) => n + summary.queues[q.key].count, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        .admin-queue { text-align: left; font-family: inherit; cursor: pointer; transition: border-color 0.15s, transform 0.15s; }
        .admin-queue:hover { border-color: var(--primary); transform: translateY(-1px); }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
      `}</style>

      <section aria-labelledby="bandeja">
        <p id="bandeja" style={sectionTitle}>Para revisar {pendingTotal > 0 ? `(${pendingTotal})` : ""}</p>
        <div className="admin-grid">
          {QUEUES.map(q => {
            const { count, oldest } = summary.queues[q.key]
            return (
              <button key={q.key} type="button" className="admin-queue" onClick={() => onGo(q.tab)}
                style={{ ...card, padding: "12px 14px", borderColor: count > 0 ? "#f0d98a" : "var(--border)" }}>
                <span style={{ display: "block", fontSize: 24, fontWeight: 700, color: count > 0 ? "#1b1b19" : "var(--muted)" }}>{count}</span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3d3d3a" }}>{q.label}</span>
                <span style={{ display: "block", fontSize: 11, color: count > 0 ? "#78590a" : "var(--primary)", marginTop: 2 }}>
                  {count > 0 ? `El más viejo, ${timeAgo(oldest, now)}` : "Al día ✓"}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="metricas">
        <p id="metricas" style={sectionTitle}>Últimos 30 días</p>
        <div className="admin-grid" style={{ marginBottom: 12 }}>
          {METRICS.map(m => {
            const pair = summary.metrics[m.key]
            const d = delta(pair)
            return (
              <div key={m.key} style={{ ...card, padding: "12px 14px" }}>
                <span style={{ display: "block", fontSize: 24, fontWeight: 700, color: "#1b1b19" }}>{pair.current}</span>
                <span style={{ display: "block", fontSize: 13, color: "#3d3d3a" }}>{m.label}</span>
                <span style={{ display: "block", fontSize: 11, color: TONE_COLOR[d.tone], marginTop: 2 }} title={`Los 30 días anteriores: ${pair.previous}`}>
                  {d.text} <span style={{ color: "var(--muted)" }}>vs. 30 días anteriores</span>
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ ...card, padding: 16 }}>
          <p style={{ ...sectionTitle, color: "#3d3d3a" }}>Visitas por día</p>
          <ViewsChart days={summary.views_by_day} />
        </div>
      </section>

      <section style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <TopList title="Más vistos (30 días)" items={summary.top_viewed} unit="visitas" />
        <TopList title="Más guardados" items={summary.top_favorited} unit="favoritos" />
      </section>

      <section aria-labelledby="contenido">
        <p id="contenido" style={sectionTitle}>Contenido para completar</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {HEALTH.map(h => {
            const { count, spots } = summary.content_health[h.key]
            return (
              <div key={h.key} style={{ ...card, padding: 16, flex: "1 1 220px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#3d3d3a", margin: "0 0 6px" }}>
                  {h.label}: <span style={{ color: count > 0 ? "#78590a" : "var(--primary)" }}>{count > 0 ? count : "ninguno ✓"}</span>
                </p>
                {spots.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.8 }}>
                    {spots.map(s => (
                      <li key={s.id}><a href={spotHref(s)} target="_blank" rel="noopener noreferrer" style={{ color: "#3d3d3a" }}>{s.name}</a></li>
                    ))}
                    {count > spots.length && <li style={{ listStyle: "none", color: "var(--muted)" }}>y {count - spots.length} más</li>}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
