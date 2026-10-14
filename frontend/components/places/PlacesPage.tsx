// Una página /lugares/...: título, texto, links para seguir explorando y las
// cards de los lugares (las mismas de la búsqueda). Se arma en el servidor.
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import JsonLd from "@/components/seo/JsonLd"
import SpotCard from "@/components/spots/SpotCard"
import { EAGER_CARDS } from "@/lib/spotCard"
import type { SpotListItem } from "@/lib/types"
import {
  activitiesIn, departmentsWith, placesHeading, placesJsonLd, placesPath, searchPath,
  type Activity, type Department, type PlaceCount,
} from "@/lib/places"

// SpotCard es .jsx.
const Card = SpotCard as unknown as (p: { spot: SpotListItem; activeCategory?: string; priority?: boolean }) => React.ReactElement

type Chip = { href: string; label: string; count?: number }

function Chips({ title, chips }: { title: string; chips: Chip[] }) {
  if (chips.length === 0) return null
  return (
    <nav aria-label={title} className="places-chips-block">
      <p className="places-chips-title">{title}</p>
      <ul className="places-chips">
        {chips.map(c => (
          <li key={c.href}>
            <Link href={c.href}>{c.label}{c.count !== undefined && <span className="places-chip-count">{c.count}</span>}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function PlacesPage({ activity, department, counts, spots, total }: {
  activity: Activity | null
  department: Department | null
  counts: PlaceCount[]
  spots: SpotListItem[]
  total: number
}) {
  const heading = placesHeading(activity, department)
  const chips: { title: string; chips: Chip[] }[] = []
  if (activity) {
    chips.push({
      title: department ? `${activity.name} en otros departamentos` : "Por departamento",
      chips: departmentsWith(counts, activity)
        .filter(d => d.slug !== department?.slug)
        .map(d => ({ href: placesPath(activity, d), label: d.name, count: d.count })),
    })
  }
  if (department) {
    chips.push({
      title: activity ? `Más para hacer en ${department.name}` : `Qué hacer en ${department.name}`,
      chips: activitiesIn(counts, department)
        .filter(a => a.slug !== activity?.slug)
        .map(a => ({ href: placesPath(a, department), label: `${a.emoji} ${a.name}`, count: a.count })),
    })
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .places-wrapper { max-width: 1100px; width: 100%; margin: 0 auto; padding: 40px 24px 64px; box-sizing: border-box; }
        .places-title {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 36px; font-weight: 700; color: #1b1b19; margin: 0; line-height: 1.2;
        }
        .places-intro { font-size: 15px; color: var(--muted-strong); line-height: 1.6; margin: 10px 0 0; max-width: 640px; }
        .places-count { font-size: 13px; color: var(--muted); margin: 6px 0 0; }

        .places-chips-block { margin: 20px 0 0; }
        .places-chips-title { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); margin: 0 0 8px; }
        .places-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
        .places-chips a {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: var(--primary-dark); text-decoration: none;
          background: #fff; border: 1px solid var(--border); border-radius: 999px; padding: 7px 14px;
          transition: background 0.15s, border-color 0.15s;
        }
        @media (hover: hover) { .places-chips a:hover { background: #e8f5ee; border-color: #b7dfc8; } }
        .places-chip-count { font-size: 11px; font-weight: 600; color: var(--muted); }

        .places-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin: 28px 0 0; }
        .places-search {
          display: inline-flex; margin: 24px 0 0; padding: 10px 22px; border-radius: 12px;
          font-size: 14px; font-weight: 600; background: var(--primary-dark); color: #fff; text-decoration: none;
        }

        @media (max-width: 640px) {
          .places-wrapper { padding: 24px 16px 48px; }
          .places-title { font-size: 28px; }
          .places-intro { font-size: 14px; }
          .places-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        }
      `}</style>
      <JsonLd data={placesJsonLd(activity, department, spots)} />

      <Navbar />

      <main id="contenido" style={{ flex: 1 }}>
        <div className="places-wrapper">
          {activity && department && (
            <p style={{ fontSize: 13, margin: "0 0 12px" }}>
              <Link href={placesPath(activity, null)} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                ← {placesHeading(activity, null)}
              </Link>
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
              Explorar
            </p>
          </div>
          <h1 className="places-title">{activity && <span aria-hidden="true">{activity.emoji} </span>}{heading}</h1>
          <p className="places-intro">
            {activity ? activity.intro : `Lugares al aire libre en ${department?.name}: para acampar, caminar, escalar, surfear o remar.`}
          </p>
          {total > 0 && <p className="places-count">{total === 1 ? "1 lugar" : `${total} lugares`}</p>}

          {chips.map(c => <Chips key={c.title} title={c.title} chips={c.chips} />)}

          {spots.length > 0 ? (
            <div className="places-grid">
              {spots.map((spot, i) => <Card key={spot.id} spot={spot} activeCategory={activity?.name} priority={i < EAGER_CARDS} />)}
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "48px 32px", textAlign: "center", marginTop: 28 }}>
              <p style={{ fontSize: 40, margin: "0 0 12px", opacity: 0.25 }}>{activity?.emoji ?? "🧭"}</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 20, fontWeight: 700, color: "#1b1b19", margin: "0 0 6px" }}>
                Todavía no hay lugares
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
                ¿Conocés uno? Sumalo y ayudá a que otros lo encuentren.
              </p>
              <Link href="/agregar-lugar" className="places-search" style={{ margin: 0 }}>＋ Sumá un lugar</Link>
            </div>
          )}

          {spots.length > 0 && (
            <Link href={searchPath(activity, department)} className="places-search">
              {total > spots.length ? `Ver los ${total} en el buscador →` : "Filtrar y ver en el mapa →"}
            </Link>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
