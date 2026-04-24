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
import SpotImage from '@/components/SpotImage';
import { CldImage } from 'next-cloudinary';



function SpotDetail({ spot }) {
  const [routes, setRoutes] = useState([])
  const [sectors, setSectors] = useState([])
  const [kayakDetail, setKayakDetail] = useState(null)
  const [surfSchool, setSurfSchool] = useState(null)
  const displayImages = spot.images?.length > 0 ? spot.images : null;

  useEffect(() => {
  if (!spot?.id) return

  if (spot.category?.name === "Trekking") {
    fetch(`http://localhost:8000/spots/${spot.id}/routes`)
      .then(res => res.json())
      .then(data => setRoutes(data))
  }
  if (spot.category?.name === "Escalada") {
    fetch(`http://localhost:8000/spots/${spot.id}/sectors`)
      .then(res => res.json())
      .then(data => setSectors(data))
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


  return (<div className="min-h-screen flex flex-col bg-[#f5f4f0]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .spot-page { font-family: 'DM Sans', sans-serif; }
        .spot-title { font-family: 'Playfair Display', serif; }

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

        @keyframes imgReveal {
          to { opacity: 1; transform: scale(1); }
        }

        .fade-up {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.2s; }
        .fade-up-3 { animation-delay: 0.3s; }
        .fade-up-4 { animation-delay: 0.4s; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .img-zoom img {
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .img-zoom:hover img {
          transform: scale(1.06);
        }

        .glass-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
        }

        .detail-row {
          position: relative;
          transition: background 0.2s;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .detail-row:hover {
          background: rgba(0,0,0,0.03);
        }

        .map-frame {
          transition: box-shadow 0.3s ease;
        }
        .map-frame:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        .btn-action {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .btn-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }
        .btn-action:active {
          transform: translateY(0px);
        }

        .go-btn {
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          letter-spacing: 0.03em;
        }
        .go-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(22, 101, 52, 0.35);
        }
        .go-btn:active {
          transform: translateY(0);
        }

        .category-pill {
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          border: 1px solid #b4aa96;
          color: #4a443b;
        }

        .department-pill {
          background: linear-gradient(135deg, #4a5650, #2C3932);
          color: #f0f1f0;
          border: 1px solid #4f5853;
        }

        .amenity-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f3f4f6;
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 14px;
        }
      `}</style>

      <Navbar />

      <div className="flex flex-1 spot-page">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">

            {/* Header */}
            <div className="flex items-end justify-between mb-6 fade-up fade-up-1">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-4xl font-semibold spot-title text-gray-900 leading-tight">
                  {spot.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium category-pill">
                  {spot.category?.name || "Sin categoría"}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium department-pill">
                  {spot.department || "Sin departamento"}
                </span>
              </div>

              <div className="flex gap-2 shrink-0">
                <button className="btn-action flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600 font-medium border border-gray-100">
                  ⭐ Guardar
                </button>
                <button className="btn-action flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600 font-medium border border-gray-100">
                  🔗 Compartir
                </button>
              </div>
            </div>

            {/* Imágenes */}

            <div className="grid grid-cols-2 gap-3 mb-10 fade-up fade-up-2">
              <div className="img-zoom overflow-hidden rounded-2xl img-reveal h-[340px] relative">
                <CldImage
                  src={spot.images[0].cloudinary_public_id}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  alt={spot.name}
                  crop="fill"
                  gravity="auto"
                  loading="eager"
                  className="object-cover"
                  quality="auto"
                  format="auto"
                  priority
                />
              </div>
              <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[340px]">
                {spot.images.slice(1).map((img, i) => (
                  <div key={i} className="img-zoom overflow-hidden rounded-xl img-reveal relative">
                    <CldImage
                      src={img.cloudinary_public_id}
                      fill
                      sizes="25vw"
                      alt={`${spot.name} ${i + 2}`}
                      crop="fill"
                      gravity="auto"
                      loading="eager"
                      className="object-cover"
                      quality="auto"
                      format="auto"
                      priority
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Layout principal */}
            <div className="space-y-6">

              {/* FILA SUPERIOR: descripción+detalles | mapa */}
              <div className="grid grid-cols-[1fr_320px] gap-6 items-stretch">

                {/* Izquierda: descripción + detalles */}
                <div className="space-y-5">
                  <SpotDescription description={spot.description} />
                  <div className="glass-card rounded-2xl p-6 shadow-sm fade-up fade-up-4">
                    <SpotDetails spot={spot} />
                  </div>
                </div>

                {/* Derecha: mapa fijo que estira al alto de la izquierda */}
                <div className="sticky top-0 h-full">
                  <MapCard />
                </div>

              </div>

              {/* FILA INFERIOR: sectores / rutas / amenities — ancho completo */}

              {spot.category?.name === "Trekking" && routes.length > 0 && (
                <TrekkingRoutes routes={routes} />
              )}

              {spot.category?.name === "Escalada" && sectors.length > 0 && (
                <ClimbingSectorsCards sectors={sectors} />
              )}

              {spot.category?.name === "Camping" && spot.amenities?.length > 0 && (
                <div className="glass-card rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-700 mb-5">
                    Amenities del Camping
                  </p>
                  <AmenitiesList amenities={spot.amenities} />
                </div>
              )}

              {spot.category?.name === "Kayak" && kayakDetail && (
                <KayakDetail kayak={kayakDetail} />
              )}
              {spot.category?.name === "Surf" && surfSchool && (
                <SurfSchoolDetail surfSchool={surfSchool} />
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