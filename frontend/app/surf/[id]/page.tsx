import { notFound } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import BackButton from "./BackButton"
import SurfPhotos from "./SurfPhotos"
import Footer from "@/components/layout/Footer"
import Pill from "@/components/ui/Pill"
import ReviewsSection from "@/components/spot-detail/ReviewsSection"

type Props = {
  params: Promise<{ id: string }>
}

const MONTHS_FULL = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

const CLASS_CONFIG: Record<string, { label: string; icon: string }> = {
  grupal:    { label: "Grupal",    icon: "👥" },
  privada:   { label: "Privada",   icon: "🧑" },
  intensivo: { label: "Intensivo", icon: "🔥" },
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surfschool/${id}`)
  if (!res.ok) return { title: "Escuela de Surf | Rumbo" }
  const school = await res.json()
  return {
    title: `${school.name} | Rumbo`,
    description: school.spot_name
      ? `Escuela de surf en ${school.spot_name}, ${school.spot_department}.`
      : "Escuela de surf en Uruguay.",
  }
}

export default async function SurfSchoolPage({ params }: Props) {
  const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surfschool/${id}`, {
    cache: "no-store",
  })
  if (!res.ok) notFound()

  const school = await res.json()

  const classInfo = school.class_type ? CLASS_CONFIG[school.class_type] : null
  const whatsappUrl = school.whatsapp
    ? `https://wa.me/${school.whatsapp.replace(/\D/g, "")}`
    : null
  const instagramHandle = school.instagram ? school.instagram.replace(/^@/, "") : null
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null
  const hasContact = school.email || school.whatsapp || school.instagram
  const isSeasonal = school.season_start && school.season_end
  const photos = [school.photo_1, school.photo_2, school.photo_3].filter(Boolean) as string[]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .surf-detail-inner {
          max-width: 1152px;
          margin: 0 auto;
          padding: 36px 24px 80px;
          flex: 1;
        }

        .surf-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        .surf-right-panel {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .surf-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .surf-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .surf-section-dot { width: 8px; height: 8px; border-radius: 50%; background: #2d6a4f; flex-shrink: 0; }
        .surf-section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #2d6a4f; margin: 0; }

.surf-contact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f0ede7;
        }
        .surf-contact-row:last-child { border-bottom: none; }
        .surf-contact-link {
          font-size: 13px;
          font-weight: 600;
          color: #2d6a4f;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.15s;
        }
        .surf-contact-link:hover { opacity: 0.7; }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 500;
          color: #9a9690;
          text-decoration: none;
          margin-bottom: 24px;
          transition: color 0.15s;
        }
        .back-link:hover { color: #1b1b19; }

        @media (max-width: 860px) {
          .surf-detail-grid {
            grid-template-columns: 1fr;
          }
          .surf-right-panel { position: static; }
          .surf-detail-inner { padding: 20px 16px 64px; }
        }
        @media (max-width: 560px) {
          .surf-photo-grid-2, .surf-photo-grid-3 {
            grid-template-columns: 1fr;
            height: auto;
          }
          .surf-photo-grid-2 .surf-photo-item,
          .surf-photo-grid-3 .surf-photo-item { height: 220px; }
          .surf-photo-sub { grid-template-rows: unset; grid-template-columns: 1fr 1fr; }
          .surf-photo-sub .surf-photo-item { height: 140px; }
        }
      `}</style>

      <Navbar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="surf-detail-inner">

          {/* Back */}
          <BackButton />

          {/* Title block */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: "#eae6df", border: "1px solid #d0c9bc", color: "#4a443b", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", padding: "4px 12px", borderRadius: 999 }}>
                🏄 Surf
              </span>
              {school.spot_name && (
                <span style={{ background: "#f0f7f3", border: "1px solid #b7dfc9", color: "#1b4332", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", padding: "4px 12px", borderRadius: 999 }}>
                  📍 {school.spot_name}
                </span>
              )}
              {school.spot_department && (
                <span style={{ background: "#1b4332", color: "#d8f3dc", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", padding: "4px 12px", borderRadius: 999 }}>
                  {school.spot_department}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 600, color: "#1b1b19", lineHeight: 1.2, margin: 0 }}>
              {school.name}
            </h1>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e0ddd6", marginBottom: 28 }} />

          <div className="surf-detail-grid">

            {/* Left: photos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Foto(s) con galería */}
              <SurfPhotos photos={photos} name={school.name} />

              {/* Temporada */}
              {isSeasonal && (
                <div className="surf-card">
                  <div className="surf-section-label">
                    <div className="surf-section-dot" />
                    <p className="surf-section-title">Temporada</p>
                  </div>
                  <p style={{ fontSize: 15, color: "#3a3730", margin: 0 }}>
                    {MONTHS_FULL[school.season_start]} — {MONTHS_FULL[school.season_end]}
                  </p>
                </div>
              )}

            </div>

            {/* Right panel */}
            <div className="surf-right-panel">

              {/* Info card */}
              <div className="surf-card">
                <div className="surf-section-label">
                  <div className="surf-section-dot" />
                  <p className="surf-section-title">Información</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {classInfo && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669" }}>Tipo de clase</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        {classInfo.icon} {classInfo.label}
                      </span>
                    </div>
                  )}
                  {school.duration != null && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669" }}>Duración</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        ⏱️ {school.duration} {school.duration === 1 ? "hora" : "horas"}
                      </span>
                    </div>
                  )}
                  {school.equipment_include != null && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669" }}>Equipo</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        🩳 {school.equipment_include ? "Incluido" : "No incluido"}
                      </span>
                    </div>
                  )}
                  {!isSeasonal && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669" }}>Temporada</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>Todo el año</span>
                    </div>
                  )}
                  {isSeasonal && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#7a7669" }}>Temporada</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19" }}>
                        {MONTHS_FULL[school.season_start]} – {MONTHS_FULL[school.season_end]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact card */}
              {hasContact && (
                <div className="surf-card">
                  <div className="surf-section-label">
                    <div className="surf-section-dot" />
                    <p className="surf-section-title">Contacto</p>
                  </div>
                  <div>
                    {school.email && (
                      <div className="surf-contact-row">
                        <span style={{ fontSize: 13, color: "#7a7669" }}>✉️ Email</span>
                        <a href={`mailto:${school.email}`} className="surf-contact-link">{school.email}</a>
                      </div>
                    )}
                    {school.whatsapp && (
                      <div className="surf-contact-row">
                        <span style={{ fontSize: 13, color: "#7a7669" }}>💬 WhatsApp</span>
                        <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer" className="surf-contact-link">
                          {school.whatsapp} <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
                        </a>
                      </div>
                    )}
                    {school.instagram && (
                      <div className="surf-contact-row">
                        <span style={{ fontSize: 13, color: "#7a7669" }}>📷 Instagram</span>
                        <a href={instagramUrl!} target="_blank" rel="noopener noreferrer" className="surf-contact-link">
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
            <ReviewsSection spotId={school.id} entityType="surf" />
          </div>

          {/* Spacer para que el footer quede lejos cuando hay poca info */}
          <div style={{ minHeight: "max(0px, calc(100vh - 600px))" }} />

        </div>
      </main>

      <Footer />
    </div>
  )
}
