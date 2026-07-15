"use client"
import { useState } from "react"
import Link from "next/link"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"

export default function SectorCard({ sector, spotSlug }) {
  const [hovered, setHovered] = useState(false)
  const href = `/spots/${spotSlug}/sectores/${sector.slug}`

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
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
            { val: sector.min_grade ? `${sector.min_grade}–${sector.max_grade}` : "—", lbl: "Graduación" },
            { val: sector.max_altitude ? `${sector.max_altitude}m` : "—", lbl: "Altitud" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="sector-stat-cell">
              <p className="sector-stat-val">{val}</p>
              <p className="sector-stat-lbl">{lbl}</p>
            </div>
          ))}
        </div>

        {sector.type && (
          <div className="sector-badges">
            <Pill variant="green" size="sm">🧗 {sector.type}</Pill>
          </div>
        )}
      </div>
    </Link>
  )
}
