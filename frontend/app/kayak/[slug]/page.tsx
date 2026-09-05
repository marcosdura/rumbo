import { notFound } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import BackButton from "./BackButton"
import KayakPhotos from "./KayakPhotos"
import Footer from "@/components/layout/Footer"
import ReviewsSection from "@/components/spot-detail/ReviewsSection"
import Pill from "@/components/ui/Pill"
import JsonLd from "@/components/seo/JsonLd"
import { idFromSlug } from "@/lib/slugify"
import { api } from "@/lib/api"

type Props = {
  params: Promise<{ slug: string }>
}

const MONTHS_FULL = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

const WATER_TYPE: Record<string, { label: string; icon: string }> = {
  rio:  { label: "Río",  icon: "🏞️" },
  lago: { label: "Lago", icon: "🌊" },
  mar:  { label: "Mar",  icon: "🌊" },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; variant: "green" | "yellow" | "red" }> = {
  facil:      { label: "Fácil",      variant: "green" },
  intermedio: { label: "Intermedio", variant: "yellow" },
  dificil:    { label: "Difícil",    variant: "red" },
}

const KAYAK_TYPE: Record<string, string> = {
  travesia:   "Travesía",
  recreativo: "Recreativo",
  rapido:     "Aguas Rápidas",
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) return { title: "Kayak | Rumbo" }
  let kayak: any
  try {
    kayak = (await api.get<any>(`/kayak/${id}`)).data
  } catch {
    return { title: "Kayak | Rumbo" }
  }
  const description = kayak.spot_name
    ? `Servicio de kayak en ${kayak.spot_name}, ${kayak.spot_department}.`
    : "Servicio de kayak en Uruguay."
  return {
    title: `${kayak.name} | Rumbo`,
    description,
    openGraph: {
      title: `${kayak.name} | Rumbo`,
      description,
      images: kayak.photo_1 ? [{ url: kayak.photo_1 }] : [],
      type: "website",
    },
  }
}

export default async function KayakDetailPage({ params }: Props) {
  const { slug } = await params
  const id = idFromSlug(slug)
  if (id === null) notFound()

  const [kayakResult, summaryResult] = await Promise.allSettled([
    api.get<any>(`/kayak/${id}`, { cache: "no-store" }),
    api.get<any>(`/kayak-reviews/${id}/summary`, { cache: "no-store" }),
  ])
  if (kayakResult.status !== "fulfilled") notFound()

  const kayak = kayakResult.value.data
  const summary = summaryResult.status === "fulfilled" ? summaryResult.value.data : { average: null, total: 0 }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: kayak.name,
    description: kayak.spot_name
      ? `Servicio de kayak en ${kayak.spot_name}, ${kayak.spot_department}.`
      : "Servicio de kayak en Uruguay.",
    ...(kayak.photo_1 ? { image: kayak.photo_1 } : {}),
    ...(kayak.spot_department ? { address: { "@type": "PostalAddress", addressRegion: kayak.spot_department } } : {}),
    ...(kayak.email ? { email: kayak.email } : {}),
    ...(summary.total > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average, reviewCount: summary.total } }
      : {}),
  }

  const waterInfo = kayak.water_type ? WATER_TYPE[kayak.water_type] : null
  const diffInfo  = kayak.difficulty ? DIFFICULTY_CONFIG[kayak.difficulty] : null
  const whatsappUrl = kayak.whatsapp
    ? `https://wa.me/${kayak.whatsapp.replace(/\D/g, "")}`
    : null
  const instagramHandle = kayak.instagram ? kayak.instagram.replace(/^@/, "") : null
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null
  const hasContact = kayak.email || kayak.whatsapp || kayak.instagram
  const isSeasonal = kayak.season_start && kayak.season_end
  const photos = [kayak.photo_1, kayak.photo_2, kayak.photo_3].filter(Boolean) as string[]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <JsonLd data={jsonLd} />
      <style>{`

        .kayak-detail-inner {
          max-width: 1152px;
          margin: 0 auto;
          padding: 36px 24px 80px;
          flex: 1;
        }

        .kayak-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        .kayak-right-panel {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .kayak-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .kayak-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .kayak-section-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }
        .kayak-section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--primary); margin: 0; }

        .kayak-contact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f0ede7;
        }
        .kayak-contact-row:last-child { border-bottom: none; }
        .kayak-contact-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.15s;
        }
        .kayak-contact-link:hover { opacity: 0.7; }

        @media (max-width: 860px) {
          .kayak-detail-grid {
            grid-template-columns: 1fr;
          }
          .kayak-right-panel { position: static; }
          .kayak-detail-inner { padding: 20px 16px 64px; }
        }
        @media (max-width: 560px) {
          .kayak-photo-grid-2, .kayak-photo-grid-3 {
            grid-template-columns: 1fr;
            height: auto;
          }
          .kayak-photo-grid-2 .kayak-photo-item,
          .kayak-photo-grid-3 .kayak-photo-item { height: 220px; }
          .kayak-photo-sub { grid-template-rows: unset; grid-template-columns: 1fr 1fr; }
          .kayak-photo-sub .kayak-photo-item { height: 140px; }
        }
      `}</style>

      <Navbar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="kayak-detail-inner">

          {/* Back */}
          <BackButton />

          {/* Title block */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Pill variant="beige" hover>🛶 Kayak</Pill>
              {kayak.spot_name && (
                <Pill variant="green" hover>📍 {kayak.spot_name}</Pill>
              )}
              {kayak.spot_department && (
                <Pill variant="dark-green" hover>{kayak.spot_department}</Pill>
              )}
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 600, color: "#1b1b19", lineHeight: 1.2, margin: 0 }}>
              {kayak.name}
            </h1>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", marginBottom: 28 }} />

          <div className="kayak-detail-grid">

            {/* Left: photos + temporada */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <KayakPhotos photos={photos} name={kayak.name} />

              {isSeasonal && (
                <div className="kayak-card">
                  <div className="kayak-section-label">
                    <div className="kayak-section-dot" />
                    <p className="kayak-section-title">Temporada</p>
                  </div>
                  <p style={{ fontSize: 15, color: "#3a3730", margin: 0 }}>
                    {MONTHS_FULL[kayak.season_start]} — {MONTHS_FULL[kayak.season_end]}
                  </p>
                </div>
              )}

            </div>

            {/* Right panel */}
            <div className="kayak-right-panel">

              {/* Info card */}
              <div className="kayak-card">
                <div className="kayak-section-label">
                  <div className="kayak-section-dot" />
                  <p className="kayak-section-title">Información</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {waterInfo && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>Tipo de agua</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        {waterInfo.icon} {waterInfo.label}
                      </span>
                    </div>
                  )}
                  {diffInfo && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>Dificultad</span>
                      <Pill variant={diffInfo.variant}>{diffInfo.label}</Pill>
                    </div>
                  )}
                  {kayak.duration != null && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>Duración</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        ⏱️ {kayak.duration} {kayak.duration === 1 ? "hora" : "horas"}
                      </span>
                    </div>
                  )}
                  {kayak.kayak_type && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>Tipo de kayak</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        🛶 {KAYAK_TYPE[kayak.kayak_type] || kayak.kayak_type}
                      </span>
                    </div>
                  )}
                  {kayak.rental_available != null && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>Alquiler</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        🏪 {kayak.rental_available ? "Disponible" : "No disponible"}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>Temporada</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                      {isSeasonal
                        ? `${MONTHS_FULL[kayak.season_start]} – ${MONTHS_FULL[kayak.season_end]}`
                        : "Todo el año"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact card */}
              {hasContact && (
                <div className="kayak-card">
                  <div className="kayak-section-label">
                    <div className="kayak-section-dot" />
                    <p className="kayak-section-title">Contacto</p>
                  </div>
                  <div>
                    {kayak.email && (
                      <div className="kayak-contact-row">
                        <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>✉️ Email</span>
                        <a href={`mailto:${kayak.email}`} className="kayak-contact-link">{kayak.email}</a>
                      </div>
                    )}
                    {kayak.whatsapp && (
                      <div className="kayak-contact-row">
                        <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>💬 WhatsApp</span>
                        <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer" className="kayak-contact-link">
                          {kayak.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                        </a>
                      </div>
                    )}
                    {kayak.instagram && (
                      <div className="kayak-contact-row">
                        <span style={{ fontSize: 13, color: "var(--muted-strong)" }}>📷 Instagram</span>
                        <a href={instagramUrl!} target="_blank" rel="noopener noreferrer" className="kayak-contact-link">
                          @{instagramHandle} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 32 }}>
            <ReviewsSection spotId={kayak.id} entityType="kayak" />
          </div>

          {/* Spacer para que el footer quede lejos cuando hay poca info */}
          <div style={{ minHeight: "max(0px, calc(100vh - 600px))" }} />

        </div>
      </main>

      <Footer />
    </div>
  )
}
