// Armazón de las páginas de una ruta de trekking y de un sector de escalada.
// Antes cada una se armaba en el navegador (pantalla de carga, sin 404 y
// sin contenido para Google) y "Compartir" no hacía nada.
import Link from "next/link"
import type { ReactNode } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ShareButton from "@/components/ui/ShareButton"
import type { Stat, TrailSpot } from "@/lib/trailPage"

export function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="trail-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// Solo los datos que se saben (lib/trailPage.ts).
export function StatGrid({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null
  return (
    <div className="trail-stats">
      {stats.map(s => (
        <div key={s.label} className="trail-stat">
          <p style={{ fontSize: 22, margin: "0 0 6px" }}>{s.icon}</p>
          <p style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 18, fontWeight: 600, color: "#1b1b19", margin: "0 0 4px" }}>{s.value}</p>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

export default function TrailLayout({ spot, eyebrow, title, children }: {
  spot: TrailSpot
  // "Ruta de trekking" / "Sector de escalada"
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .trail-inner { max-width: 1152px; margin: 0 auto; padding: 36px 24px 64px; width: 100%; box-sizing: border-box; flex: 1; }
        .trail-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--muted); text-decoration: none; margin-bottom: 24px; transition: color 0.15s; }
        .trail-back:hover { color: #1b1b19; }
        .trail-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .trail-stat { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 20px 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .trail-card { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 24px 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .trail-body { display: flex; flex-direction: column; gap: 20px; }
        @media (max-width: 640px) {
          .trail-inner { padding: 20px 16px 48px; }
          .trail-stats { grid-template-columns: repeat(2, 1fr); }
          .trail-card { padding: 20px 16px; }
        }
      `}</style>

      <Navbar />

      <main className="trail-inner">
        {/* Al lugar, no router.back(): entrando por un link de afuera sacaba de Rumbo. */}
        <Link href={`/spots/${spot.slug}`} className="trail-back">← {spot.name}</Link>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>{eyebrow}</p>
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
          </div>
          <ShareButton name={title} />
        </div>

        <div className="trail-body">{children}</div>
      </main>

      <Footer />
    </div>
  )
}
