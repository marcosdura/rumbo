"use client"

import { useEffect, useState } from "react"
import SpotList from "../components/SpotList"
import Navbar from "../components/Navbar"

export default function Home() {
  const [spots, setSpots] = useState([])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/spots")
      .then(res => res.json())
      .then(data => setSpots(data))
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .home-page { font-family: 'DM Sans', sans-serif; }
        .home-title { font-family: 'Playfair Display', serif; }

        .fade-up {
          opacity: 0;
          transform: translateY(18px);
          animation: fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .section-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9ca3a0;
        }

        .spots-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 500;
          color: #065f46;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border: 1px solid #6ee7b7;
          border-radius: 20px;
          padding: 2px 10px;
          margin-left: 10px;
          vertical-align: middle;
          position: relative;
          top: -2px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, rgba(0,0,0,0.06), transparent);
          margin: 0.75rem 0 1.5rem;
        }
      `}</style>

      <Navbar />

      <div className="flex flex-1 overflow-hidden home-page">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">

            {/* Header */}
            <div className="mb-2 fade-up fade-up-1">
              <p className="section-label">Descubrí Uruguay</p>
              <h2 className="home-title text-4xl font-semibold text-gray-900 mt-1">
                Spots populares del mes
                {spots.length > 0 && (
                  <span className="spots-count">{spots.length}</span>
                )}
              </h2>
            </div>

            <div className="divider fade-up fade-up-2" />

            {/* Grid */}
            <div className="fade-up fade-up-3">
              {spots.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-64 rounded-2xl animate-pulse"
                      style={{ background: "rgba(0,0,0,0.06)" }}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <SpotList spots={spots} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}