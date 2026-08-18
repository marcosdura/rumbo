"use client"

import Link from "next/link"
import { s } from "./styles"

interface Props {
  reviewsCount: number
  favoritesCount: number
}

export default function StatsRow({ reviewsCount, favoritesCount }: Props) {
  return (
    <div className="fade-up fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[
        { number: reviewsCount.toString(), label: "Reviews", emoji: "💬", href: "/reviews" },
        { number: favoritesCount.toString(), label: "Favoritos", emoji: "❤️", href: "/favorites" },
      ].map(stat => (
        <Link key={stat.label} href={stat.href} style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ ...s.card, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "box-shadow 0.2s, transform 0.2s", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f7f5f0", border: "1px solid #e0ddd6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {stat.emoji}
              </div>
              <div>
                <p style={s.statNumber}>{stat.number}</p>
                <p style={s.statLabel}>{stat.label}</p>
              </div>
            </div>
            <span style={{ fontSize: 14, color: "#b0aca5" }}>→</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
