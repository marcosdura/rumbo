// La página pública de una escuela de surf o un servicio de kayak. Antes
// eran dos páginas casi iguales (app/surf y app/kayak, ~360 líneas cada
// una): cada mejora había que hacerla dos veces.
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import EmailContact from "@/components/ui/EmailContact"
import Footer from "@/components/layout/Footer"
import Pill from "@/components/ui/Pill"
import ReportButton from "@/components/ui/ReportButton"
import ReviewsSection from "@/components/spot-detail/ReviewsSection"
import BackButton from "./BackButton"
import OperatorPhotos from "./OperatorPhotos"
import ShareButton from "./ShareButton"
import { directionsUrl, offSeasonNotice, whatsappUrl } from "@/lib/spotDetail"
import type { InfoRow } from "@/lib/operatorPage"
import type { PublicOperatorBase, ReviewSummary } from "@/lib/types"

type Props = {
  operator: PublicOperatorBase
  summary: ReviewSummary
  activity: { emoji: string; label: string }
  rows: InfoRow[]
  reviewEntity: "surf" | "kayak"
  report: { kind: "surf_school" | "kayak"; what: string; label: string }
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="op-section-label">
      <div className="op-section-dot" />
      <p className="op-section-title">{children}</p>
    </div>
  )
}

export default function OperatorPage({ operator, summary, activity, rows, reviewEntity, report }: Props) {
  const instagramHandle = operator.instagram ? operator.instagram.replace(/^@/, "") : null
  const hasContact = operator.email || operator.whatsapp || operator.instagram
  const photos = [operator.photo_1, operator.photo_2, operator.photo_3].filter(Boolean) as string[]
  const offSeason = offSeasonNotice(operator)
  // Sin nada a la izquierda, el panel ocupa el ancho (antes la columna
  // quedaba vacía y la página se veía rota).
  const hasMain = photos.length > 0
  const beachUrl = operator.spot_slug ? `/spots/${operator.spot_slug}` : null
  const canGetThere = operator.spot_lat != null && operator.spot_lng != null

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <style>{`
        .op-inner { max-width: 1152px; margin: 0 auto; padding: 36px 24px 80px; flex: 1; width: 100%; box-sizing: border-box; }
        .op-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .op-panel { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
        .op-grid.is-panel-only { grid-template-columns: 1fr; }
        .op-grid.is-panel-only .op-panel { position: static; display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
        .op-card { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 24px 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .op-section-label { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .op-section-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }
        .op-section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--primary); margin: 0; }
        .op-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .op-row-label { font-size: 13px; color: var(--muted-strong); }
        .op-row-value { font-size: 13px; font-weight: 600; color: #1b1b19; text-align: right; }
        .op-contact-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0ede7; }
        .op-contact-row:last-child { border-bottom: none; }
        .op-contact-link { font-size: 13px; font-weight: 600; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 4px; transition: opacity 0.15s; min-width: 0; word-break: break-all; }
        .op-contact-link:hover { opacity: 0.7; }
        .op-directions {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--primary-dark); color: #fff; font-size: 13px; font-weight: 600;
          padding: 12px 20px; border-radius: 999px; text-decoration: none; letter-spacing: 0.03em;
          transition: background 0.22s;
        }
        .op-directions:hover { background: var(--primary); }
        .op-rating { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; color: #3d3d3a; text-decoration: none; }
        .op-rating .star { color: var(--primary); font-size: 18px; }
        .op-rating .count { color: var(--muted); text-decoration: underline; text-underline-offset: 2px; }
        @media (max-width: 860px) {
          .op-grid { grid-template-columns: 1fr; }
          .op-panel { position: static; }
          .op-grid.is-panel-only .op-panel { grid-template-columns: 1fr; }
          .op-inner { padding: 20px 16px 64px; }
        }
      `}</style>

      <Navbar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="op-inner">
          <BackButton fallback={beachUrl ?? "/search"} />

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Pill variant="beige" hover>{activity.emoji} {activity.label}</Pill>
              {operator.spot_name && (beachUrl
                ? <Link href={beachUrl} style={{ textDecoration: "none" }}><Pill variant="green" hover>📍 {operator.spot_name}</Pill></Link>
                : <Pill variant="green">📍 {operator.spot_name}</Pill>)}
              {operator.spot_department && <Pill variant="dark-green" hover>{operator.spot_department}</Pill>}
              {offSeason && (
                <span style={{ fontSize: 13, color: "#78590a", background: "#fef9e7", border: "1px solid #f0d98a", borderRadius: 999, padding: "3px 10px" }}>
                  ⚠️ {offSeason}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 600, color: "#1b1b19", lineHeight: 1.2, margin: 0 }}>
                {operator.name}
              </h1>
              <ShareButton name={operator.name} />
            </div>
            {/* El puntaje ya lo calcula el servidor (antes solo iba al JSON-LD). */}
            <a href="#reviews" className="op-rating">
              <span className="star">★</span>
              {summary.total > 0 ? (
                <>
                  <strong>{summary.average}</strong>
                  <span className="count">{summary.total} reseña{summary.total !== 1 ? "s" : ""}</span>
                </>
              ) : (
                <span className="count">¡Sé el primero en reseñar!</span>
              )}
            </a>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", marginBottom: 28 }} />

          <div className={`op-grid${hasMain ? "" : " is-panel-only"}`}>
            {hasMain && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <OperatorPhotos photos={photos} name={operator.name} />
              </div>
            )}

            <div className="op-panel">
              {rows.length > 0 && (
                <div className="op-card">
                  <SectionLabel>Información</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {rows.map(r => (
                      <div key={r.label} className="op-row">
                        <span className="op-row-label">{r.label}</span>
                        {r.pill
                          ? <Pill variant={r.pill}>{r.value}</Pill>
                          : <span className="op-row-value">{r.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasContact && (
                <div className="op-card">
                  <SectionLabel>Contacto</SectionLabel>
                  <div>
                    {operator.email && (
                      <div className="op-contact-row">
                        <span className="op-row-label">✉️ Email</span>
                        <EmailContact email={operator.email} linkClassName="op-contact-link" />
                      </div>
                    )}
                    {operator.whatsapp && (
                      <div className="op-contact-row">
                        <span className="op-row-label">💬 WhatsApp</span>
                        <a href={whatsappUrl(operator.whatsapp, operator.name)} target="_blank" rel="noopener noreferrer" className="op-contact-link">
                          {operator.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                        </a>
                      </div>
                    )}
                    {instagramHandle && (
                      <div className="op-contact-row">
                        <span className="op-row-label">📷 Instagram</span>
                        <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer" className="op-contact-link">
                          @{instagramHandle} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {canGetThere && (
                <a href={directionsUrl(operator.spot_lat!, operator.spot_lng!)} target="_blank" rel="noopener noreferrer" className="op-directions">
                  📍 Cómo llegar{operator.spot_name ? ` a ${operator.spot_name}` : ""}
                </a>
              )}
            </div>
          </div>

          <div id="reviews" style={{ marginTop: 32, scrollMarginTop: 100 }}>
            <ReviewsSection spotId={operator.id} entityType={reviewEntity} />
          </div>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <ReportButton targetKind={report.kind} targetId={operator.id} what={report.what} label={report.label}
              style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }} />
          </div>

          {/* Para que el footer quede lejos cuando hay poca info */}
          <div style={{ minHeight: "max(0px, calc(100vh - 600px))" }} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
