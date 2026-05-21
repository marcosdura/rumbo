"use client"

import Footer from "@/components/layout/Footer"
import { useEffect, useState } from "react"
import Navbar from "@/components/layout/Navbar"
import SpotSection from "@/components/spots/SpotSection"
import SearchBar from "@/components/spots/SearchBar"

export default function Home() {
  const [spots, setSpots] = useState([])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/spots")
      .then(res => res.json())
      .then(data => setSpots(data))
  }, [])

  const loading = spots.length === 0

  const lavallejaSpots = spots.filter(s => s.department === "Lavalleja").slice(0, 6)
  const rochaSpots     = spots.filter(s => s.department === "Rocha").slice(0, 6)

  const sections = [
    {
      label: "Descubrí Uruguay",
      title: "Spots populares del mes",
      spots: spots.slice(0, 6),
      count: spots.length,
      href: "/search",
    },
    {
      label: "Destacados",
      title: "Spots en Lavalleja",
      spots: lavallejaSpots,
      count: lavallejaSpots.length,
      href: "/search?department=Lavalleja",
    },
    {
      label: "Destacados",
      title: "Spots en Rocha",
      spots: rochaSpots,
      count: rochaSpots.length,
      href: "/search?department=Rocha",
    },
  ]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fade-up {
          opacity: 0;
          transform: translateY(18px);
          animation: fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Navbar />

      <div style={{ flex: 1, overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0px 24px 64px" }}>

          {/* Secciones */}
          {sections.map((section) => (
            <SpotSection
              key={section.title}
              label={section.label}
              title={section.title}
              count={section.count}
              spots={section.spots}
              href={section.href}
              loading={loading}
            />
          ))}

        </div>
        <Footer />
      </div>
    </div>
  )
}