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

// "Otras rutas en este lugar" / "Otros sectores": antes había que volver al lugar.
export function OtherLinks({ title, items }: { title: string; items: { href: string; name: string; facts: string }[] }) {
  if (items.length === 0) return null
  return (
    <SectionCard title={title}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map(i => (
          <Link key={i.href} href={i.href} className="trail-other">
            <span style={{ fontWeight: 600, color: "#1b1b19" }}>{i.name}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{i.facts} →</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}

// Solo los datos que se saben (lib/trailPage.ts).
// compact: una fila de datos chicos (el sector, debajo de sus fotos) en vez
// de los recuadros grandes.
export function StatGrid({ stats, compact = false }: { stats: Stat[]; compact?: boolean }) {
  if (stats.length === 0) return null
  if (compact) {
    return (
      <ul className="trail-stats-compact">
        {stats.map(s => (
          <li key={s.label}>
            <span aria-hidden="true">{s.icon}</span>
            <strong>{s.value}</strong>
            {/* "2 vías" ya dice qué es: sin repetir "Vías" al lado. */}
            {!String(s.value).toLowerCase().includes(s.label.toLowerCase()) && (
              <span className="trail-stats-compact-label">{s.label}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="trail-stats">
      {stats.map(s => (
        <div key={s.label} className="trail-stat">
          <p style={{ fontSize: 22, margin: "0 0 6px" }}>{s.icon}</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 18, fontWeight: 700, color: "#1b1b19", margin: "0 0 4px" }}>{s.value}</p>
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
        .trail-stats-compact { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
        .trail-stats-compact li {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff; border: 1px solid var(--border); border-radius: 999px; padding: 6px 12px;
          font-size: 13px; color: #1b1b19;
        }
        /* Hover: el de las pills (.pill-hover, globals.css), en verde. */
        .trail-stats-compact li { transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        @media (hover: hover) {
          .trail-stats-compact li:hover { background: #f0f7f3; border-color: #b7dfc8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
        }
        .trail-stats-compact strong { font-weight: 700; }
        /* Los datos de una ruta o un sector, juntos en una fila de pills. */
        .trail-facts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .trail-facts:empty { display: none; }
        .trail-stats-compact-label { font-size: 11px; font-weight: 600; color: var(--muted-strong); text-transform: uppercase; letter-spacing: 0.06em; }
        .trail-stat { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 20px 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .trail-card { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 24px 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .trail-body { display: flex; flex-direction: column; gap: 20px; }
        .trail-other { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 10px; border-bottom: 1px solid #ede9e1; text-decoration: none; font-size: 14px; border-radius: 10px; }
        .trail-other:last-child { border-bottom: none; }
        .trail-other:hover { background: #f7f5f0; }
        @media (max-width: 640px) {
          .trail-inner { padding: 20px 16px 48px; }
          .trail-stats { grid-template-columns: repeat(2, 1fr); }
          .trail-card { padding: 20px 16px; }
        }
      `}</style>

      <Navbar />

      <main id="contenido" className="trail-inner">
        {/* Al lugar, no router.back(): entrando por un link de afuera sacaba de Rumbo. */}
        <Link href={`/spots/${spot.slug}`} className="trail-back">← {spot.name}</Link>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>{eyebrow}</p>
            </div>
            <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>
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
