import { notFound } from "next/navigation"
import Link from "next/link"

type Props = {
  params: Promise<{ id: string }>
}

const MONTHS = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"]
const MONTHS_FULL = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

const CLASS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  grupal:    { label: "Clase grupal",    icon: "👥", color: "#1b4332", bg: "#d1fae5" },
  privada:   { label: "Clase privada",   icon: "🧑", color: "#1e3a5f", bg: "#dbeafe" },
  intensivo: { label: "Clase intensivo", icon: "🔥", color: "#7c2d12", bg: "#fee2e2" },
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surfschool/${id}`)
  if (!res.ok) return { title: "Escuela de Surf | Rumbo" }
  const school = await res.json()
  return {
    title: `${school.name} | Rumbo`,
    description: school.spot_name
      ? `Escuela de surf en ${school.spot_name}, ${school.spot_department}. Clases de surf en Uruguay.`
      : "Escuela de surf en Uruguay. Clases, alquiler de equipos y más en Rumbo.",
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
  const isSeasonal = school.season_start && school.season_end
  const hasContact = school.email || school.whatsapp || school.instagram
  const extraPhotos = [school.photo_2, school.photo_3].filter(Boolean)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f5f4f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .surf-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .surf-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }

        .surf-contact-link {
          font-size: 14px;
          font-weight: 600;
          color: #2d6a4f;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.15s;
        }
        .surf-contact-link:hover { opacity: 0.75; }

        .surf-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          transition: color 0.15s;
          padding: 8px 0;
        }
        .surf-back-link:hover { color: #fff; }

        @media (min-width: 700px) {
          .surf-content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
        }
        @media (max-width: 699px) {
          .surf-content-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
        }
      `}</style>

      {/* Hero */}
      <div style={{ position: "relative", width: "100%", height: "clamp(320px, 55vh, 520px)", overflow: "hidden" }}>
        {school.photo_1 ? (
          <img src={school.photo_1} alt={school.name} className="surf-hero-img" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #1b4332 0%, #2d6a4f 60%, #40916c 100%)" }} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 35%, rgba(0,0,0,0.6) 100%)",
        }} />

        {/* Back link */}
        <div style={{ position: "absolute", top: 20, left: 24 }}>
          <Link href="/" className="surf-back-link">
            ← Explorar
          </Link>
        </div>

        {/* Title block */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 28px 32px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#95d5b2", marginBottom: 8,
            }}>
              🏄 Escuela de Surf · Uruguay
              {school.spot_department ? ` · ${school.spot_department}` : ""}
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px",
              lineHeight: 1.15,
              textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}>
              {school.name}
            </h1>
            {school.spot_name && (
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", margin: 0 }}>
                📍 {school.spot_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px" }}>

        <div className="surf-content-grid">

          {/* Left: detalles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Badges */}
            <div style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #e0ddd6",
              padding: "22px 24px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a9690", margin: "0 0 16px" }}>
                Información de la clase
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {classInfo && (
                  <span className="surf-badge" style={{ background: classInfo.bg, color: classInfo.color }}>
                    {classInfo.icon} {classInfo.label}
                  </span>
                )}
                {school.duration != null && (
                  <span className="surf-badge" style={{ background: "#f5f4f0", color: "#3a3730" }}>
                    ⏱️ {school.duration} {school.duration === 1 ? "hora" : "horas"}
                  </span>
                )}
                {school.equipment_include != null && (
                  <span className="surf-badge" style={{
                    background: school.equipment_include ? "#d1fae5" : "#f5f4f0",
                    color: school.equipment_include ? "#1b4332" : "#7a7669",
                  }}>
                    🩳 {school.equipment_include ? "Equipo incluido" : "Sin equipo"}
                  </span>
                )}
              </div>
            </div>

            {/* Temporada */}
            {isSeasonal && (
              <div style={{
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #e0ddd6",
                padding: "22px 24px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a9690", margin: "0 0 14px" }}>
                  Temporada
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#1b4332", margin: 0 }}>{MONTHS[school.season_start]}</p>
                    <p style={{ fontSize: 11, color: "#9a9690", margin: "2px 0 0" }}>{MONTHS_FULL[school.season_start]}</p>
                  </div>
                  <div style={{ height: 1, flex: 1, background: "#e0ddd6" }} />
                  <div style={{ fontSize: 13, color: "#9a9690" }}>hasta</div>
                  <div style={{ height: 1, flex: 1, background: "#e0ddd6" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#1b4332", margin: 0 }}>{MONTHS[school.season_end]}</p>
                    <p style={{ fontSize: 11, color: "#9a9690", margin: "2px 0 0" }}>{MONTHS_FULL[school.season_end]}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contacto */}
            {hasContact && (
              <div style={{
                background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
                borderRadius: 20,
                padding: "22px 24px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#95d5b2", margin: "0 0 16px" }}>
                  Contacto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {school.email && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>✉️ Email</span>
                      <a href={`mailto:${school.email}`} className="surf-contact-link" style={{ color: "#95d5b2" }}>
                        {school.email}
                      </a>
                    </div>
                  )}
                  {school.whatsapp && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>💬 WhatsApp</span>
                      <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer" className="surf-contact-link" style={{ color: "#95d5b2" }}>
                        {school.whatsapp} <span style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                      </a>
                    </div>
                  )}
                  {school.instagram && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>📷 Instagram</span>
                      <a href={instagramUrl!} target="_blank" rel="noopener noreferrer" className="surf-contact-link" style={{ color: "#95d5b2" }}>
                        @{instagramHandle} <span style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: galería */}
          {extraPhotos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a9690", margin: 0 }}>
                Galería
              </p>
              {extraPhotos.map((src, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    aspectRatio: "4/3",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  <img
                    src={src}
                    alt={`${school.name} — foto ${i + 2}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer note */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e0ddd6", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9a9690" }}>
            Información publicada en{" "}
            <Link href="/" style={{ color: "#2d6a4f", textDecoration: "none", fontWeight: 600 }}>Rumbo</Link>
            {" "}— la plataforma de spots outdoor en Uruguay
          </p>
        </div>

      </div>
    </div>
  )
}
