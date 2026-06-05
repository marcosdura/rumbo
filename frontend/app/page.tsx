"use client"

import Footer from "@/components/layout/Footer"
import { useEffect, useState } from "react"
import Navbar from "@/components/layout/Navbar"
import HeroHeader from "@/components/layout/HeroHeader"
import SpotSection from "@/components/spots/SpotSection"
import SearchBar from "@/components/spots/SearchBar"

type Spot = { id: number; name: string; department: string; [key: string]: unknown }

export default function Home() {
  const [spots, setSpots] = useState<Spot[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots`)
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
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

      {/* Navbar: fixed en home, oculto hasta que el hero salga del viewport */}
      <Navbar />

      {/* Hero — scrollea con la página */}
      <div id="hero-section" style={{ background: "linear-gradient(160deg, #1b4332 0%, #2d6a4f 65%, #40916c 100%)", position: "relative", zIndex: 20, padding: "24px 24px 52px", textAlign: "center" }}>
        <HeroHeader />

        <p className="fade-up fade-up-1" style={{
          fontFamily: "'DM Sans', sans-serif",
          color: "#95d5b2",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}>Uruguay al natural</p>

        <h1 className="fade-up fade-up-2" style={{
          fontFamily: "'Playfair Display', serif",
          color: "#fff",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 600,
          lineHeight: 1.15,
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}>Encontrá tu próxima aventura</h1>

        <p className="fade-up fade-up-2" style={{
          fontFamily: "'DM Sans', sans-serif",
          color: "#b7e4c7",
          fontSize: "clamp(15px, 2vw, 18px)",
          fontWeight: 300,
          marginBottom: 40,
        }}>Camping, Trekking y mucho más...</p>

        <div className="fade-up fade-up-3" style={{ display: "flex", justifyContent: "center" }}>
          <SearchBar hero />
        </div>
      </div>

      <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0px 24px 64px" }}>

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