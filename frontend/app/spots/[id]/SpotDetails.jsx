"use client"

import { useEffect, useState } from "react"
import Navbar from "../../../components/Navbar"
import AmenitiesList from "../../../components/AmenitiesList"
import MapCard from "../../../components/MapCard"
import SpotDescription from "../../../components/SpotDescription"
import SpotDetails from "../../../components/SpotDetails"
import TrekkingRoutes from "../../../components/TrekkingRoutes"
import ClimbingSectorsCards from "../../../components/ClimbingSectorsCards"
import KayakDetail from "../../../components/KayakDetail"
import SurfSchoolDetail from "../../../components/SurfSchoolDetail"
import Footer from "../../../components/Footer"
import { CldImage } from 'next-cloudinary'
import FavoriteButton from "@/components/FavoriteButton"
import ReviewsSection from "@/components/ReviewsSection"
import SpotImages from "../../../components/SpotImages"
import ShareModal from "@/components/ShareModal"


function SpotDetail({ spot }) {
  const [routes, setRoutes] = useState([])
  const [sectors, setSectors] = useState([])
  const [kayakDetail, setKayakDetail] = useState(null)
  const [surfSchool, setSurfSchool] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [reviewSummary, setReviewSummary] = useState(null)

useEffect(() => {
  if (!spot?.id) return
  fetch(`http://localhost:8000/reviews/${spot.id}/summary`)
    .then(r => r.json())
    .then(setReviewSummary)
}, [spot?.id])

  useEffect(() => {
    if (!spot?.id) return
    if (spot.category?.name === "Trekking") {
      fetch(`http://localhost:8000/spots/${spot.id}/routes`)
        .then(res => res.json()).then(data => setRoutes(data))
    }
    if (spot.category?.name === "Escalada") {
      fetch(`http://localhost:8000/spots/${spot.id}/sectors`)
        .then(res => res.json()).then(data => setSectors(data))
    }
    if (spot.category?.name === "Kayak") {
      fetch(`http://localhost:8000/spots/${spot.id}/kayak-detail`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setKayakDetail(data) })
    }
    if (spot.category?.name === "Surf") {
      fetch(`http://localhost:8000/spots/${spot.id}/surf-school`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setSurfSchool(data) })
    }
  }, [spot.id])

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .spot-page { font-family: 'DM Sans', sans-serif; }

        /* Imágenes */
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

        /* Header pills */
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

        /* Rating badge */
        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 500;
          color: #3d3d3a;
        }
        .rating-badge .star { color: #2d6a4f; font-size: 14px; }
        .rating-badge .reviews-link {
          color: #9a9690;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          font-weight: 400;
        }

        /* Action buttons */
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

        /* Amenities */
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

        /* Divider between header and images */
        .spot-divider {
          border: none;
          border-top: 1px solid #e0ddd6;
          margin: 0 0 28px 0;
        }
      `}</style>

      <Navbar />

      {showShare && <ShareModal name={spot.name} onClose={() => setShowShare(false)} />}
      <div className="flex flex-1 spot-page">
        <div className="flex-1 overflow-y-auto">
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "36px 24px 48px" }}>

            {/* Header */}
            <div className="fade-up fade-up-1" style={{ marginBottom: 24 }}>

              {/* Título + acciones */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 38, fontWeight: 600, color: "#1b1b19",
                  lineHeight: 1.15, margin: 0, maxWidth: 680,
                }}>
                  {spot.name}
                </h1>

                <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 4 }}>
                  <FavoriteButton spot={spot} variant="detail" />
                  <button className="action-btn" onClick={() => setShowShare(true)}>🔗 Compartir</button>
                </div>
              </div>

              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="rating-badge">
                  <span className="star">★</span>
                  <strong>{reviewSummary?.total > 0 ? reviewSummary.average : "—"}</strong>
                  <span
                    className="reviews-link"
                    onClick={() => {
                      const el = document.getElementById("reviews")
                      if (!el) return
                      // si no hay reseñas, scroll al formulario para escribir
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
                <span className="category-pill">{spot.category?.name || "Sin categoría"}</span>
                <span className="department-pill">{spot.department || "Sin departamento"}</span>
              </div>
            </div>

            {/* Imágenes */}
            <div className="fade-up fade-up-2" style={{ marginBottom: 36 }}>
              <SpotImages images={spot.images} name={spot.name} />
            </div>

            {/* Layout principal */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Fila superior: descripción + detalles | mapa */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "stretch" }}>

                {/* Izquierda */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="fade-up fade-up-3">
                    <SpotDescription description={spot.description} />
                  </div>
                  <div className="fade-up fade-up-4" style={{
                    background: "#fff",
                    border: "1px solid #e0ddd6",
                    borderRadius: 20,
                    padding: "24px 28px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}>
                    <SpotDetails spot={spot} />
                  </div>
                </div>

                {/* Derecha: mapa */}
                <div style={{ position: "sticky", top: 24, height: "fit-content" }}>
                  <MapCard lat={spot.lat} lng={spot.lng} name={spot.name} />
                </div>
              </div>

              {/* Fila inferior: contenido dinámico por categoría */}
              {spot.category?.name === "Trekking" && routes.length > 0 && (
                <TrekkingRoutes routes={routes} />
              )}

              {spot.category?.name === "Escalada" && sectors.length > 0 && (
                <ClimbingSectorsCards sectors={sectors} />
              )}

              {spot.category?.name === "Camping" && spot.amenities?.length > 0 && (
                <div className="amenities-card">
                  <div className="amenities-label">
                    <div className="amenities-dot" />
                    <p className="amenities-title">Amenities del Camping</p>
                  </div>
                  <AmenitiesList amenities={spot.amenities} />
                </div>
              )}

              {spot.category?.name === "Kayak" && kayakDetail && (
                <KayakDetail kayak={kayakDetail} />
              )}
              {spot.category?.name === "Surf" && surfSchool && (
                <SurfSchoolDetail surfSchool={surfSchool} />
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