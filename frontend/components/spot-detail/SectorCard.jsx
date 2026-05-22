"use client"
import { useState } from "react"
import Link from "next/link"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"

export default function SectorCard({ sector }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/sectors/${sector.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="sector-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="sector-card-header">
          <h3 className="sector-card-title">{sector.name}</h3>
          <CircleArrow active={hovered} />
        </div>

        <div className="sector-stats-grid">
          {[
            { val: `${sector.routes_count}`, lbl: "Rutas" },
            { val: `${sector.min_grade}–${sector.max_grade}`, lbl: "Graduación" },
            { val: `${sector.altitude}m`, lbl: "Altitud" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="sector-stat-cell">
              <p className="sector-stat-val">{val}</p>
              <p className="sector-stat-lbl">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="sector-badges">
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
