"use client"

import { useEffect, useState } from "react"

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
import AmenitiesList from "../../../components/spot-detail/AmenitiesList"
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
import GlampingAmenitiesList from "../../../components/spot-detail/GlampingAmenitiesList"

const MapCard = dynamic(() => import("../../../components/spots/MapCard"), { ssr: false })

function SpotDetail({ spot }) {
  const [routes, setRoutes] = useState([])
  const [sectors, setSectors] = useState([])
  const [kayakDetails, setKayakDetails] = useState([])
  const [surfSchools, setSurfSchools] = useState([])
  const [showShare, setShowShare] = useState(false)
  const [reviewSummary, setReviewSummary] = useState(null)
  const router = useRouter()

useEffect(() => {
  if (!spot?.id) return
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${spot.id}/summary`)
    .then(r => r.json())
    .then(setReviewSummary)
}, [spot?.id])

  useEffect(() => {
    if (!spot?.id) return
    if (spot.category?.name === "Trekking") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spot.id}/routes`)
        .then(res => res.json()).then(data => setRoutes(data))
    }
    if (spot.category?.name === "Escalada") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spot.id}/sectors`)
        .then(res => res.json()).then(data => setSectors(data))
    }
    if (spot.category?.name === "Kayak") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spot.id}/kayak-detail`)
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (data) setKayakDetails(data) })
    }
    if (spot.category?.name === "Surf") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots/${spot.id}/surf-schools`)
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (data) setSurfSchools(data) })
    }
  }, [spot.id])

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .spot-page { font-family: 'DM Sans', sans-serif; }

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

        .fade-up {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        .fade-up-4 { animation-delay: 0.35s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .img-zoom img {
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .img-zoom:hover img { transform: scale(1.06); }

        .category-pill {
          background: #eae6df;
          border: 1px solid #d0c9bc;
          color: #4a443b;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.04em;
          padding: 4px 12px;
          border-radius: 999px;
        }
        .department-pill {
          background: #1b4332;
          color: #d8f3dc;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.04em;
          padding: 4px 12px;
          border-radius: 999px;
        }

        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 500;
          color: #3d3d3a;
        }
        .rating-badge .star { color: #2d6a4f; font-size: 20px; }
        .rating-badge strong { font-weight: 600; }
        .rating-badge .reviews-link {
          color: #9a9690;
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
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1px solid #e0ddd6;
          background: #fff;
          color: #3d3d3a;
        }
        .action-btn:hover {
          background: #f7f5f0;
          transform: translateY(-1px);
        }

        .amenities-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .amenities-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .amenities-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #2d6a4f; flex-shrink: 0;
        }
        .amenities-title {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #2d6a4f; margin: 0;
        }

        .spot-divider {
          border: none;
          border-top: 1px solid #e0ddd6;
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
          font-family: 'Playfair Display', serif;
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
          border: 1px solid #e0ddd6;
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
          color: #9a9690;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 24px 0;
          font-family: 'DM Sans', sans-serif;
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
          }
          .amenities-card {
            padding: 18px 16px;
          }
        }
      `}</style>

      <Navbar />

      {showShare && <ShareModal name={spot.name} onClose={() => setShowShare(false)} />}
      <div className="flex flex-1 spot-page">
        <div className="flex-1 overflow-y-auto">
          <div className="spot-page-inner">

            <button onClick={() => router.back()} className="mobile-back-btn">
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
                  <strong>{reviewSummary?.total > 0 ? reviewSummary.average : "—"}</strong>
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
                    {reviewSummary?.total > 0
                      ? `${reviewSummary.total} reseña${reviewSummary.total !== 1 ? "s" : ""}`
                      : "¡Sé el primero en reseñar!"}
                  </span>
                </span>
                <span style={{ color: "#d0cdc7", fontSize: 14 }}>·</span>
                {spot.categories && spot.categories.length > 0 ? (
                  spot.categories.map((cat) => (
                    <span key={cat.id} className="category-pill">
                      {CATEGORY_EMOJIS[cat.name] && `${CATEGORY_EMOJIS[cat.name]} `}
                      {cat.name}
                    </span>
                  ))
                ) : (
                  <span className="category-pill">
                    {CATEGORY_EMOJIS[spot.category?.name] && `${CATEGORY_EMOJIS[spot.category.name]} `}
                    {spot.category?.name || "Sin categoría"}
                  </span>
                )}
                <span className="department-pill">{spot.department || "Sin departamento"}</span>
              </div>
            </div>

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
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
                lineHeight: 1.4,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{spot.is_public ? "✅" : "⚠️"}</span>
                <span style={{ color: spot.is_public ? "#1b4332" : "#7f1d1d" }}>
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

              {spot.category?.name === "Trekking" && routes.length > 0 && (
                <TrekkingRoutes routes={routes} spotSlug={spot.slug} />
              )}

              {spot.category?.name === "Escalada" && sectors.length > 0 && (
                <ClimbingSectorsCards sectors={sectors} spotSlug={spot.slug} />
              )}

              {spot.camping_detail && (
                <div className="amenities-card">
                  <div className="amenities-label">
                    <div className="amenities-dot" />
                    <p className="amenities-title">⛺ Información del Camping</p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: spot.amenities?.length > 0 ? 18 : 0 }}>
                    {spot.camping_detail.price != null && (
                      <div style={{
                        background: "#f5f4f0", border: "1px solid #e0ddd6", borderRadius: 12,
                        padding: "10px 14px", minWidth: 140,
                      }}>
                        <p style={{ fontSize: 11, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Precio por noche
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                          ${spot.camping_detail.price}
                        </p>
                      </div>
                    )}
                  </div>
                  {spot.amenities?.length > 0 && (
                    <AmenitiesList amenities={spot.amenities} />
                  )}
                </div>
              )}

              {spot.glamping_detail && spot.glamping_detail.length > 0 && (
                <div className="amenities-card">
                  <div className="amenities-label">
                    <div className="amenities-dot" />
                    <p className="amenities-title">🛖 Información del Glamping</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: spot.glamping_amenities ? 18 : 0 }}>
                    {spot.glamping_detail.map((unit, index) => (
                      <div key={unit.id ?? index}>
                        {spot.glamping_detail.length > 1 && (
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#2d6a4f", margin: "0 0 8px" }}>
                            {unit.accommodation_type
                              ? unit.accommodation_type.charAt(0).toUpperCase() + unit.accommodation_type.slice(1)
                              : `Tipo ${index + 1}`}
                          </p>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                          {unit.accommodation_type && spot.glamping_detail.length === 1 && (
                            <div style={{
                              background: "#f5f4f0", border: "1px solid #e0ddd6", borderRadius: 12,
                              padding: "10px 14px", minWidth: 140,
                            }}>
                              <p style={{ fontSize: 11, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Tipo de alojamiento
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0, textTransform: "capitalize" }}>
                                {unit.accommodation_type}
                              </p>
                            </div>
                          )}
                          {unit.capacity != null && (
                            <div style={{
                              background: "#f5f4f0", border: "1px solid #e0ddd6", borderRadius: 12,
                              padding: "10px 14px", minWidth: 140,
                            }}>
                              <p style={{ fontSize: 11, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Capacidad
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                                {unit.capacity} persona{unit.capacity !== 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                          {unit.price_per_night != null && (
                            <div style={{
                              background: "#f5f4f0", border: "1px solid #e0ddd6", borderRadius: 12,
                              padding: "10px 14px", minWidth: 140,
                            }}>
                              <p style={{ fontSize: 11, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Precio por noche
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                                ${unit.price_per_night}
                              </p>
                            </div>
                          )}
                          {unit.min_nights != null && (
                            <div style={{
                              background: "#f5f4f0", border: "1px solid #e0ddd6", borderRadius: 12,
                              padding: "10px 14px", minWidth: 140,
                            }}>
                              <p style={{ fontSize: 11, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Mínimo de noches
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>
                                {unit.min_nights} noche{unit.min_nights !== 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                        </div>
                        {spot.glamping_detail.length > 1 && index < spot.glamping_detail.length - 1 && (
                          <hr style={{ border: "none", borderTop: "1px solid #e0ddd6", margin: "14px 0 0" }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {spot.glamping_amenities && (
                    <GlampingAmenitiesList amenities={spot.glamping_amenities} />
                  )}
                </div>
              )}

              {spot.motorhome_detail && (
                <MotorhomeCard motorhomeDetail={spot.motorhome_detail} />
              )}

              {spot.category?.name === "Kayak" && kayakDetails.length > 0 && (
                <KayakDetail kayaks={kayakDetails} />
              )}
              {spot.category?.name === "Surf" && surfSchools.length > 0 && (
                <SurfSchoolDetail surfSchools={surfSchools} />
              )}

              {/* Reviews */}
              <div id="reviews">
                <ReviewsSection spotId={spot.id} />
              </div>
            </div>

          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default SpotDetail
