"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api"
import "./spot-page.css"

import Navbar from "../../../components/layout/Navbar"
import SpotDescription from "../../../components/spot-detail/SpotDescription"
import SpotDetails from "../../../components/spot-detail/SpotDetails"
import TrekkingRoutes from "../../../components/spot-detail/TrekkingRoutes"
import TrekkingAmenitiesCard from "../../../components/spot-detail/TrekkingAmenitiesCard"
import ClimbingSectorsCards from "../../../components/spot-detail/ClimbingSectorsCards"
import ServiceSection from "@/components/spot-detail/ServiceSection"
import Footer from "../../../components/layout/Footer"
import FavoriteButton from "@/components/spot-detail/FavoriteButton"
import ReviewsSection from "@/components/spot-detail/ReviewsSection"
import SpotImages from "../../../components/spot-detail/SpotImages"
import ShareModal from "@/components/spot-detail/ShareModal"
import MotorhomeCard from "../../../components/spot-detail/MotorhomeCard"
import CampingCard from "../../../components/spot-detail/CampingCard"
import GlampingCard from "../../../components/spot-detail/GlampingCard"
import ExperienciasSection from "../../../components/spot-detail/ExperienciasSection"
import Pill from "@/components/ui/Pill"
import { AddButton, EmptySection, OwnerBar, PendingNotice } from "@/components/spot-detail/AddToSpot"
import { addToSpotUrl } from "@/components/agregar-lugar/prefill"
import ReportButton from "@/components/ui/ReportButton"
import SuggestedNotice from "@/components/spot-detail/SuggestedNotice"
import { cameFromRumbo, lastUpdatedLabel, offSeasonNotice } from "@/lib/spotDetail"
import { activityHref, departmentHref } from "@/lib/places"
import NearbySpots from "@/components/spot-detail/NearbySpots"
import type { Experience } from "@/components/spot-detail/ExperienciasSection"
import type { PendingContribution } from "@/components/spot-detail/AddToSpot"
import type { DetailSpot } from "@/lib/spotDetail"
import type { Amenity } from "@/components/spot-detail/CampingCard"
import type { GlampingAmenities } from "@/components/spot-detail/GlampingAmenitiesList"
import type { SpotPhoto } from "@/components/spot-detail/SpotImages"
import type { TrekkingDetail } from "@/lib/types"

// Lo que trae GET /spots/by-slug/{slug} (y la vista previa). Los paneles de
// cada categoría (.jsx) leen más campos de los que se listan acá.
export type SpotPageData = DetailSpot & {
  id: number
  name: string
  slug?: string | null
  description?: string | null
  department?: string | null
  lat?: number | null
  lng?: number | null
  is_approved?: boolean
  is_public?: boolean | null
  suggested_by_visitor?: boolean
  info_updated_at?: string | null
  images?: SpotPhoto[]
  routes?: unknown[]
  climbing_sectors?: unknown[]
  amenities?: Amenity[]
  experiences?: Experience[]
  camping_detail?: unknown
  glamping_amenities?: GlampingAmenities | null
  motorhome_detail?: unknown
  trekking_detail?: TrekkingDetail | null
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "Camping":   "⛺",
  "Glamping":  "🛖",
  "Trekking":  "🥾",
  "Escalada":  "🧗",
  "Surf":      "🏄",
  "Kayak":     "🛶",
  "Motorhome": "🚐",
}

const STAY_TYPE_ORDER = ["Camping", "Glamping", "Motorhome"]

const MapCard = dynamic(() => import("../../../components/spots/MapCard"), { ssr: false })

// preview: la vista previa del admin o del dueño (/dashboard/spots/[id]/vista-previa):
// avisa que no está publicado y no cuenta como visita.
function SpotDetail({ spot, preview = false }: { spot: SpotPageData; preview?: boolean }) {
  const routes = spot.routes ?? []
  const sectors = spot.climbing_sectors ?? []
  // Playa (Surf) o laguna (Kayak): sin datos de escuela ni de servicio.
  const venueService = spot.category?.name === "Surf" ? "surf" : spot.category?.name === "Kayak" ? "kayak" : null
  const isVenue = venueService !== null && !spot.surf_detail && !spot.kayak_service_detail
  const [showShare, setShowShare] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  // Quién mira: si es el dueño y qué aportes suyos están en revisión acá.
  // La página se genera en el servidor sin sesión; esto lo pide el navegador.
  const [viewer, setViewer] = useState<{ is_owner: boolean; pending: PendingContribution[] }>({ is_owner: false, pending: [] })

  useEffect(() => {
    if (!spot?.id || !session?.id_token) return
    api.get<{ is_owner: boolean; pending: PendingContribution[] }>(`/spots/${spot.id}/viewer`, { token: session.id_token })
      .then(({ data }) => setViewer(data))
      .catch(() => {})  // sin esto la página funciona igual, solo sin los accesos
  }, [spot?.id, session?.id_token])

  // Visita para la métrica de populares (backend/views.py): una vez que se
  // sabe si hay sesión, para no contar a la misma persona como dos. El
  // backend la cuenta una vez por persona y por día.
  useEffect(() => {
    if (!spot?.id || status === "loading" || preview) return
    api.post(`/spots/${spot.id}/view`, undefined, { token: session?.id_token }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- una por lugar y por carga de sesión
  }, [spot?.id, status])

  // El puntaje del encabezado viene con el lugar (el servidor ya lo calcula):
  // antes se pedía aparte y se veía "★ —" hasta que llegaba.
  const reviewCount = spot.review_count ?? 0
  const offSeason = offSeasonNotice(spot)

  const stayCards: Record<string, ReactNode> = {
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
  const orderedStayTypes = primaryStayType && STAY_TYPE_ORDER.includes(primaryStayType)
    ? [primaryStayType, ...STAY_TYPE_ORDER.filter((t) => t !== primaryStayType)]
    : STAY_TYPE_ORDER
  const orderedStayCards = orderedStayTypes.map((t) => stayCards[t]).filter(Boolean)

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <Navbar />

      {showShare && <ShareModal name={spot.name} onClose={() => setShowShare(false)} />}
      <div className="flex flex-1 spot-page">
        <div className="flex-1 overflow-y-auto">
          <main id="contenido" className="spot-page-inner">
            {preview && (
              <p role="status" style={{ background: spot.is_approved ? "#eef7f1" : "#fef9e7", border: `1px solid ${spot.is_approved ? "#b7dfc8" : "#f0d98a"}`, color: spot.is_approved ? "#1f5135" : "#6b4e06", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, margin: "0 0 16px" }}>
                👁 Vista previa: {spot.is_approved ? "este lugar ya está publicado." : "este lugar todavía no está publicado. Así lo va a ver la gente."}
              </p>
            )}

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
                  <button
                    type="button"
                    className="reviews-link"
                    onClick={() => {
                      const el = document.getElementById("reviews")
                      if (!el) return
                      const y = el.getBoundingClientRect().top + window.scrollY - 140
                      window.scrollTo({ top: y, behavior: "smooth" })
                    }}
                  >
                    {reviewCount > 0
                      ? `${reviewCount} reseña${reviewCount !== 1 ? "s" : ""}`
                      : "¡Sé el primero en reseñar!"}
                  </button>
                </span>
                <span style={{ color: "#d0cdc7", fontSize: 14 }}>·</span>
                {/* Las pills llevan a esa actividad en el departamento ("Camping en
                    Rocha") y a los lugares del departamento (lib/places.ts). */}
                {(spot.categories && spot.categories.length > 0 ? spot.categories : spot.category ? [spot.category] : []).map((cat) => (
                  <Link key={cat.name} href={activityHref(cat.name, spot.department)} style={{ textDecoration: "none" }}>
                    <Pill variant="beige" hover>
                      {CATEGORY_EMOJIS[cat.name] && `${CATEGORY_EMOJIS[cat.name]} `}
                      {cat.name}
                    </Pill>
                  </Link>
                ))}
                {spot.department && (
                  <Link href={departmentHref(spot.department)} style={{ textDecoration: "none" }}>
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
                <ExperienciasSection experiences={spot.experiences} />
              )}

              {/* Escuela de surf o servicio de kayak: sus datos propios. */}
              <ServiceSection spot={spot} />
              {/* Playa o laguna (Surf / Kayak sin datos de escuela): las escuelas o
                  servicios que hay cerca. Antes colgaban de la playa. */}
              {isVenue && (
                <>
                  <NearbySpots
                    spotId={spot.id}
                    services={venueService}
                    label={venueService === "surf" ? "Para aprender o alquilar" : "Para salir a remar"}
                    title={venueService === "surf" ? "Escuelas de surf cerca" : "Servicios de kayak cerca"}
                  />
                  <div>
                    <AddButton href="/agregar-lugar">{venueService === "surf" ? "＋ Sumar tu escuela de surf" : "＋ Sumar tu servicio de kayak"}</AddButton>
                  </div>
                </>
              )}

              {/* Reviews */}
              <div id="reviews">
                <ReviewsSection spotId={spot.id} />
              </div>

              <NearbySpots spotId={spot.id} />

              {/* Cuándo cambió por última vez la información, y al lado cómo
                  avisar si algo ya no es así. El dueño no reporta su propio
                  lugar (el backend tampoco lo deja). */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{lastUpdatedLabel(spot.info_updated_at)}</p>
                {!viewer.is_owner && (
                  <ReportButton targetKind="spot" targetId={spot.id} what="este lugar" label="⚑ Reportar este lugar"
                    className="text-btn" style={{ fontSize: 12 }} />
                )}
              </div>
            </div>

          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default SpotDetail
