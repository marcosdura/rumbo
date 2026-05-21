"use client"
import { useState } from "react"
import Link from "next/link"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"

function SectorCard({ sector }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/sectors/${sector.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0ddd6",
          borderRadius: 16,
          padding: "20px",
          transition: "box-shadow 0.2s, transform 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          setHovered(true)
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)"
          e.currentTarget.style.transform = "translateY(-2px)"
        }}
        onMouseLeave={e => {
          setHovered(false)
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform = "translateY(0)"
        }}
      >

        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 600,
            color: "#1b1b19", margin: 0,
          }}>
            {sector.name}
          </h3>
          <CircleArrow active={hovered} />
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { val: `${sector.routes_count}`, lbl: "Rutas" },
            { val: `${sector.min_grade}–${sector.max_grade}`, lbl: "Graduación" },
            { val: `${sector.altitude}m`, lbl: "Altitud" },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{
              background: "#f7f5f0",
              border: "1px solid #e0ddd6",
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1b1b19", margin: 0, lineHeight: 1.2 }}>{val}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.08em", margin: "4px 0 0" }}>{lbl}</p>
            </div>
          ))}
        </div>

        {/* Orientación + roca */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { icon: "🧭", val: sector.orientation, lbl: "Orientación" },
            { icon: "🪨", val: sector.rock_type, lbl: "Tipo de roca" },
          ].map(({ icon, val, lbl }) => (
            <div key={lbl} style={{
              flex: 1,
              background: "#f7f5f0",
              border: "1px solid #e0ddd6",
              borderRadius: 12,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{val}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.08em", margin: "2px 0 0" }}>{lbl}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Pill variant={sector.bolted ? "green" : "yellow"}>
            🔩 {sector.bolted ? "Equipado" : "Trad / mixto"}
          </Pill>
          <Pill variant={sector.shade === "full" ? "green" : sector.shade === "partial" ? "subtle-green" : "orange"}>
            ☀️ {sector.shade === "full" ? "Sombra total" : sector.shade === "partial" ? "Semisombra" : "Sol directo"}
          </Pill>
          <Pill variant={sector.water_available ? "green" : "red"}>
            💧 {sector.water_available ? "Agua disponible" : "Sin agua"}
          </Pill>
        </div>

      </div>
    </Link>
  )
}

function ClimbingSectorsCards({ sectors }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Sectores de Escalada
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {sectors.map(sector => (
          <SectorCard key={sector.id} sector={sector} />
        ))}
      </div>

    </div>
  )
}

export default ClimbingSectorsCards