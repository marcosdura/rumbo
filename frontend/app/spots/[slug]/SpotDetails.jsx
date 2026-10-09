"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

const CATEGORY_EMOJIS = {
  "Camping":   "⛺",
  "Glamping":  "🛖",
  "Trekking":  "🥾",
  "Escalada":  "🧗",
  "Surf":      "🏄",
  "Kayak":     "🛶",
  "Motorhome": "🚐",
}
import { useRouter } from "next/navigation"
import Navbar from "../../../components/layout/Navbar"
import dynamic from "next/dynamic"
import SpotDescription from "../../../components/spot-detail/SpotDescription"
import SpotDetails from "../../../components/spot-detail/SpotDetails"
import TrekkingRoutes from "../../../components/spot-detail/TrekkingRoutes"
import TrekkingAmenitiesCard from "../../../components/spot-detail/TrekkingAmenitiesCard"
import ClimbingSectorsCards from "../../../components/spot-detail/ClimbingSectorsCards"
import KayakDetail from "../../../components/spot-detail/KayakDetail"
import SurfSchoolDetail from "../../../components/spot-detail/SurfSchoolDetail"
import Footer from "../../../components/layout/Footer"
import { CldImage } from 'next-cloudinary'
import FavoriteButton from "@/components/spot-detail/FavoriteButton"
import ReviewsSection from "@/components/spot-detail/ReviewsSection"
import SpotImages from "../../../components/spot-detail/SpotImages"
import ShareModal from "@/components/spot-detail/ShareModal"
import MotorhomeCard from "../../../components/spot-detail/MotorhomeCard"
import CampingCard from "../../../components/spot-detail/CampingCard"
import GlampingCard from "../../../components/spot-detail/GlampingCard"
import ExperienciasSection from "../../../components/spot-detail/ExperienciasSection"
import Pill from "@/components/ui/Pill"
import { useSession } from "next-auth/react"
import { AddButton, EmptySection, OwnerBar, PendingNotice } from "@/components/spot-detail/AddToSpot"
import { addToSpotUrl } from "@/components/agregar-lugar/prefill"
import ReportButton from "@/components/ui/ReportButton"
import SuggestedNotice from "@/components/spot-detail/SuggestedNotice"
import { cameFromRumbo, offSeasonNotice } from "@/lib/spotDetail"
import NearbySpots from "@/components/spot-detail/NearbySpots"
import Link from "next/link"

const STAY_TYPE_ORDER = ["Camping", "Glamping", "Motorhome"]

const MapCard = dynamic(() => import("../../../components/spots/MapCard"), { ssr: false })

function SpotDetail({ spot }) {
  const routes = spot.routes ?? []
  const sectors = spot.climbing_sectors ?? []
  const kayakDetails = spot.kayak_detail ?? []
  const surfSchools = spot.surf_schools ?? []
  const [showShare, setShowShare] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  // Quién mira: si es el dueño y qué aportes suyos están en revisión acá.
  // La página se genera en el servidor sin sesión; esto lo pide el navegador.
  const [viewer, setViewer] = useState({ is_owner: false, pending: [] })

  useEffect(() => {
    if (!spot?.id || !session?.id_token) return
    api.get(`/spots/${spot.id}/viewer`, { token: session.id_token })
      .then(({ data }) => setViewer(data))
      .catch(() => {})  // sin esto la página funciona igual, solo sin los accesos
  }, [spot?.id, session?.id_token])

  // Visita para la métrica de populares (backend/views.py): una vez que se
  // sabe si hay sesión, para no contar a la misma persona como dos. El
  // backend la cuenta una vez por persona y por día.
  useEffect(() => {
    if (!spot?.id || status === "loading") return
    api.post(`/spots/${spot.id}/view`, undefined, { token: session?.id_token }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- una por lugar y por carga de sesión
  }, [spot?.id, status])

  // El puntaje del encabezado viene con el lugar (el servidor ya lo calcula):
  // antes se pedía aparte y se veía "★ —" hasta que llegaba.
  const reviewCount = spot.review_count ?? 0
  const offSeason = offSeasonNotice(spot)

  const stayCards = {
    Camping: spot.camping_detail ? (
      <CampingCard key="camping" amenities={spot.amenities} />
    ) : null,
    Glamping: spot.glamping_detail && spot.glamping_detail.length > 0 ? (
      <GlampingCard key="glamping" glampingDetail={spot.glamping_detail} glampingAmenities={spot.glamping_amenities} />
    ) : null,
    Motorhome: spot.motorhome_detail ? (
      <MotorhomeCard key="motorhome" motorhomeDetail={spot.motorhome_detail} />
    ) : null,
  }
  const primaryStayType = spot.category?.name
  const orderedStayTypes = STAY_TYPE_ORDER.includes(primaryStayType)
    ? [primaryStayType, ...STAY_TYPE_ORDER.filter((t) => t !== primaryStayType)]
    : STAY_TYPE_ORDER
  const orderedStayCards = orderedStayTypes.map((t) => stayCards[t]).filter(Boolean)

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>

      <style>{`

        .spot-page { font-family: var(--font-dm-sans), sans-serif; }

        .img-reveal {
          opacity: 0;
          transform: scale(1.03);
          animation: imgReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .img-reveal:nth-child(1) { animation-delay: 0.05s; }
        .img-reveal:nth-child(2) { animation-delay: 0.15s; }
        .img-reveal:nth-child(3) { animation-delay: 0.2s; }
        .img-reveal:nth-child(4) { animation-delay: 0.25s; }
        .img-reveal:nth-child(5) { animation-delay: 0.3s; }
        @keyframes imgReveal { to { opacity: 1; transform: scale(1); } }

        .img-zoom img {
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .img-zoom:hover img { transform: scale(1.06); }

        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 500;
          color: #3d3d3a;
        }
        .rating-badge .star { color: var(--primary); font-size: 20px; }
        .rating-badge strong { font-weight: 600; }
        .rating-badge .reviews-link {
          color: var(--muted);
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          font-weight: 400;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-dm-sans), sans-serif;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1px solid var(--border);
          background: #fff;
          color: #3d3d3a;
        }
        .action-btn:hover {
          background: #f7f5f0;
          transform: translateY(-1px);
        }

        .spot-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 0 0 28px 0;
        }

        .spot-page-inner {
          max-width: 1152px;
          margin: 0 auto;
          padding: 36px 24px 48px;
        }

        .spot-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .spot-title {
          font-family: var(--font-playfair-display), serif;
          font-size: 38px;
          font-weight: 600;
          color: #1b1b19;
          line-height: 1.15;
          margin: 0;
          max-width: 680px;
        }

        .spot-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .spot-main-grid {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 24px;
          align-items: start;
        }

        .spot-right-panel {
          position: sticky;
          top: 24px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .mobile-back-btn {
          display: none;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 24px 0;
          font-family: var(--font-dm-sans), sans-serif;
        }

        @media (max-width: 768px) {
          .mobile-back-btn { display: flex; }
          .spot-page-inner {
            padding: 20px 16px 40px;
          }
          .spot-header-row {
            flex-direction: column;
            gap: 12px;
          }
          .spot-title {
            font-size: 26px;
            max-width: 100%;
          }
          .spot-actions {
            margin-top: 0;
          }
          .spot-main-grid {
            grid-template-columns: 1fr;
          }
          .spot-right-panel {
            position: static;
            padding: 20px 16px;
            /* En el celular, precio y contacto antes que la descripción y el
               mapa: es lo que se busca para ir. */
            order: -1;
          }
        }
      `}</style>

      <Navbar />

      {showShare && <ShareModal name={spot.name} onClose={() => setShowShare(false)} />}
      <div className="flex flex-1 spot-page">
        <div className="flex-1 overflow-y-auto">
          <div className="spot-page-inner">

            <button
              onClick={() => cameFromRumbo(document.referrer, window.location.origin) ? router.back() : router.push("/search")}
              className="mobile-back-btn"
            >
              ← Volver
            </button>

            {/* Header */}
            <div className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
              <div className="spot-header-row">
                <h1 className="spot-title">
                  {spot.name}
                </h1>

                <div className="spot-actions">
                  <FavoriteButton spot={spot} variant="detail" />
                  <button className="action-btn" onClick={() => setShowShare(true)}>🔗 Compartir</button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="rating-badge">
                  <span className="star">★</span>
                  <strong>{reviewCount > 0 ? spot.average_rating : "—"}</strong>
                  <span
                    className="reviews-link"
                    onClick={() => {
                      const el = document.getElementById("reviews")
                      if (!el) return
                      const y = el.getBoundingClientRect().top + window.scrollY - 140
                      window.scrollTo({ top: y, behavior: "smooth" })
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {reviewCount > 0
                      ? `${reviewCount} reseña${reviewCount !== 1 ? "s" : ""}`
                      : "¡Sé el primero en reseñar!"}
                  </span>
                </span>
                <span style={{ color: "#d0cdc7", fontSize: 14 }}>·</span>
                {/* Las pills llevan a la búsqueda de esa actividad o departamento. */}
                {(spot.categories?.length > 0 ? spot.categories : spot.category ? [spot.category] : []).map((cat) => (
                  <Link key={cat.name} href={`/search?activity=${encodeURIComponent(cat.name)}`} style={{ textDecoration: "none" }}>
                    <Pill variant="beige" hover>
                      {CATEGORY_EMOJIS[cat.name] && `${CATEGORY_EMOJIS[cat.name]} `}
                      {cat.name}
                    </Pill>
                  </Link>
                ))}
                {spot.department && (
                  <Link href={`/search?department=${encodeURIComponent(spot.department)}`} style={{ textDecoration: "none" }}>
                    <Pill variant="dark-green" hover>{spot.department}</Pill>
                  </Link>
                )}
                {offSeason && (
                  <span style={{ fontSize: 13, color: "#78590a", background: "#fef9e7", border: "1px solid #f0d98a", borderRadius: 999, padding: "3px 10px" }}>
                    ⚠️ {offSeason}
                  </span>
                )}
              </div>
            </div>

            {spot.suggested_by_visitor && <SuggestedNotice spotId={spot.id} />}
            {viewer.is_owner && <OwnerBar spotId={spot.id} />}
            <PendingNotice pending={viewer.pending} />

            {/* Imágenes */}
            <div className="fade-up fade-up-2" style={{ marginBottom: spot.is_public != null ? 12 : 36 }}>
              <SpotImages images={spot.images} name={spot.name} />
            </div>

            {/* Banner acceso público/privado */}
            {spot.is_public != null && (
              <div style={{
                background: spot.is_public ? "#e8f5ee" : "#fdf0f0",
                border: `1px solid ${spot.is_public ? "#b7dfc8" : "#f5c0c0"}`,
                borderRadius: 12,
                padding: "10px 14px",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
                lineHeight: 1.4,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{spot.is_public ? "✅" : "⚠️"}</span>
                <span style={{ color: spot.is_public ? "var(--primary-dark)" : "#7f1d1d" }}>
                  {spot.is_public
                    ? "Lugar de acceso público — Te pedimos que respetes el entorno, cuides la naturaleza y dejes el lugar como lo encontraste."
                    : "Lugar de acceso privado — Antes de visitar, contactá al lugar para confirmar disponibilidad y condiciones de acceso."}
                </span>
              </div>
            )}

            {/* Layout principal */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Fila superior: descripción + mapa | detalles y contacto */}
              <div className="spot-main-grid">

                {/* Izquierda: descripción + mapa */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="fade-up fade-up-3">
                    <SpotDescription description={spot.description} />
                  </div>
                  <div className="fade-up fade-up-4">
                    <MapCard lat={spot.lat} lng={spot.lng} name={spot.name} />
                  </div>
                </div>

                {/* Derecha: detalles y contacto */}
                <div className="fade-up fade-up-4 spot-right-panel">
                  <SpotDetails spot={spot} />
                </div>
              </div>

              {/* Contenido dinámico por categoría */}
              {spot.category?.name === "Trekking" && (
                <TrekkingAmenitiesCard trekkingDetail={spot.trekking_detail} />
              )}

              {/* Rutas: las suma solo el dueño del lugar. */}
              {spot.category?.name === "Trekking" && routes.length > 0 && (
                <TrekkingRoutes
                  routes={routes}
                  spotSlug={spot.slug}
                  action={viewer.is_owner ? <AddButton href={addToSpotUrl("ruta", spot.id)}>＋ Agregar una ruta</AddButton> : undefined}
                />
              )}
              {spot.category?.name === "Trekking" && routes.length === 0 && viewer.is_owner && (
                <EmptySection
                  title="Rutas de Trekking"
                  text="Todavía no cargaste rutas en este lugar."
                  href={addToSpotUrl("ruta", spot.id)}
                  label="＋ Agregar una ruta"
                />
              )}

              {/* Escalada es abierta: cualquiera sugiere sectores (pasan por
                  revisión), así que la sección se muestra aunque esté vacía. */}
              {spot.category?.name === "Escalada" && sectors.length > 0 && (
                <ClimbingSectorsCards
                  sectors={sectors}
                  spotSlug={spot.slug}
                  action={<AddButton href={addToSpotUrl("sector", spot.id)}>＋ Sugerir un sector</AddButton>}
                />
              )}
              {spot.category?.name === "Escalada" && sectors.length === 0 && (
                <EmptySection
                  title="Sectores de Escalada"
                  text="Todavía no hay sectores cargados en este lugar. ¿Conocés alguno? Sugerilo y lo revisamos."
                  href={addToSpotUrl("sector", spot.id)}
                  label="＋ Sugerir un sector"
                />
              )}

              {orderedStayCards}

              {(spot.category?.name === "Camping" || spot.category?.name === "Glamping" || spot.category?.name === "Motorhome") && (
                <ExperienciasSection spotId={spot.id} />
              )}

              {/* Playas y lagunas son lugares públicos: cualquiera suma su escuela
                  o servicio (queda en revisión y pasa a ser su dueño), así que la
                  sección se muestra aunque esté vacía. */}
              {spot.category?.name === "Kayak" && kayakDetails.length > 0 && (
                <KayakDetail
                  kayaks={kayakDetails}
                  action={<AddButton href={addToSpotUrl("kayak", spot.id)}>＋ Sumar tu servicio de kayak</AddButton>}
                />
              )}
              {spot.category?.name === "Kayak" && kayakDetails.length === 0 && (
                <EmptySection
                  title="Alquiler de Kayaks"
                  text="Todavía no hay servicios de kayak en este lugar. ¿Ofrecés uno? Sumalo y lo revisamos."
                  href={addToSpotUrl("kayak", spot.id)}
                  label="＋ Sumar tu servicio de kayak"
                />
              )}
              {spot.category?.name === "Surf" && surfSchools.length > 0 && (
                <SurfSchoolDetail
                  surfSchools={surfSchools}
                  action={<AddButton href={addToSpotUrl("surf", spot.id)}>＋ Sumar tu escuela de surf</AddButton>}
                />
              )}
              {spot.category?.name === "Surf" && surfSchools.length === 0 && (
                <EmptySection
                  title="Escuelas de Surf"
                  text="Todavía no hay escuelas de surf en esta playa. ¿Tenés una? Sumala y la revisamos."
                  href={addToSpotUrl("surf", spot.id)}
                  label="＋ Sumar tu escuela de surf"
                />
              )}

              {/* Reviews */}
              <div id="reviews">
                <ReviewsSection spotId={spot.id} />
              </div>

              <NearbySpots spotId={spot.id} />

              {/* El dueño no reporta su propio lugar (el backend tampoco lo deja). */}
              {!viewer.is_owner && (
                <div style={{ textAlign: "right" }}>
                  <ReportButton targetKind="spot" targetId={spot.id} what="este lugar" label="⚑ Reportar este lugar"
                    style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }} />
                </div>
              )}
            </div>

          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default SpotDetail
