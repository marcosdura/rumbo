"use client"

import { useEffect, useState } from "react"
import Navbar from "../../../components/Navbar"
import AmenitiesList from "../../../components/AmenitiesList"
import MapCard from "../../../components/MapCard"
import SpotDescription from "../../../components/SpotDescription"
import SpotDetails from "../../../components/SpotDetails"
import TrekkingRoutes from "../../../components/TrekkingRoutes"
import ClimbingSectorsCards from "../../../components/ClimbingSectorsCards"

function SpotDetail({ spot }) {
  const [routes, setRoutes] = useState([])
  const [sectors, setSectors] = useState([])

  useEffect(() => {
    if (spot?.category?.name === "Trekking") {
      fetch(`http://localhost:8000/spots/${spot.id}/routes`)
        .then(res => res.json())
        .then(data => setRoutes(data))
    }
    if (spot?.category?.name === "Escalada") {
      fetch(`http://localhost:8000/spots/${spot.id}/sectors`)
        .then(res => res.json())
        .then(data => setSectors(data))
    }
  }, [spot])

  const images = ["https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",]

  return (<div className="h-screen flex flex-col bg-[#f5f4f0]">

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
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .department-pill {
          background: linear-gradient(135deg, #d8e0ff, #b0c1fe);
          color: #161f3e;
          border: 1px solid #2652b8;
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

      <div className="flex flex-1 overflow-hidden spot-page">
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
              <div className="img-zoom overflow-hidden rounded-2xl img-reveal h-[340px]">
                <img
                  src={`${images[0]}?w=1200&q=80`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[340px]">
                {images.slice(1).map((img, i) => (
                  <div key={i} className="img-zoom overflow-hidden rounded-xl img-reveal">
                    <img
                      src={`${img}?w=800&q=80`}
                      loading="lazy"
                      className="w-full h-full object-cover"
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

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpotDetail