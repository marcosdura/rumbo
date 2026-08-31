"use client"

import Footer from "@/components/layout/Footer"
import { useEffect, useState } from "react"
import Navbar from "@/components/layout/Navbar"
import HeroHeader from "@/components/layout/HeroHeader"
import SpotSection from "@/components/spots/SpotSection"
import SearchBar from "@/components/spots/SearchBar"
import { api } from "@/lib/api"

type Spot = { id: number; name: string; department: string; [key: string]: unknown }
type Section = { data: Spot[]; total: number }

export default function Home() {
  const [recent, setRecent]       = useState<Section>({ data: [], total: 0 })
  const [lavalleja, setLavalleja] = useState<Section>({ data: [], total: 0 })
  const [rocha, setRocha]         = useState<Section>({ data: [], total: 0 })
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    // 3 pedidos chicos y ya filtrados en vez de traer el catálogo entero y
    // recortarlo a mano acá — antes esto pedía TODOS los spots aprobados
    // solo para mostrar 6 en cada sección.
    const fetchSection = (params: string): Promise<Section> =>
      api.get<Spot[]>(`/spots?${params}`).then(({ data, totalCount }) => ({
        data: Array.isArray(data) ? data : [],
        total: totalCount ?? 0,
      }))

    Promise.all([
      fetchSection("limit=6"),
      fetchSection("department=Lavalleja&limit=6"),
      fetchSection("department=Rocha&limit=6"),
    ]).then(([r, l, ro]) => {
      setRecent(r)
      setLavalleja(l)
      setRocha(ro)
      setLoading(false)
    }).catch((e) => {
      setError(e instanceof Error ? e.message : "Error al cargar los spots.")
      setLoading(false)
    })
  }, [retryTick])

  const sections = [
    {
      label: "Descubrí Uruguay",
      title: "Spots populares del mes",
      spots: recent.data,
      count: recent.total,
      href: "/search",
    },
    {
      label: "Destacados",
      title: "Spots en Lavalleja",
      spots: lavalleja.data,
      count: lavalleja.total,
      href: "/search?department=Lavalleja",
    },
    {
      label: "Destacados",
      title: "Spots en Rocha",
      spots: rocha.data,
      count: rocha.total,
      href: "/search?department=Rocha",
    },
  ]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');
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

          {error ? (
            <div style={{ textAlign: "center", padding: "64px 24px" }}>
              <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</p>
              <button
                onClick={() => setRetryTick((t) => t + 1)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#2d6a4f",
                  background: "#fff",
                  border: "1px solid #2d6a4f",
                  borderRadius: 10,
                  padding: "10px 20px",
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          ) : (
            sections.map((section) => (
              <SpotSection
                key={section.title}
                label={section.label}
                title={section.title}
                count={section.count}
                spots={section.spots}
                href={section.href}
                loading={loading}
              />
            ))
          )}

        </div>
        <Footer />
      </div>
    </div>
  )
}