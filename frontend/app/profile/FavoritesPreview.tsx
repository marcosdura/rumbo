"use client"

import Link from "next/link"
import { CldImage } from "next-cloudinary"
import { s } from "./styles"

interface Props {
  favorites: any[]
}

export default function FavoritesPreview({ favorites }: Props) {
  if (favorites.length === 0) return null

  return (
    <div className="fade-up fade-up-3" style={{ ...s.card, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f" }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
            Últimos favoritos
          </p>
        </div>
        {favorites.length > 3 && (
          <Link href="/favorites" style={{ fontSize: 12, color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}>
            Ver todos ({favorites.length}) →
          </Link>
        )}
      </div>
      <div className="profile-favs-grid">
        {favorites.slice(0, 3).map(spot => {
          const main = spot.images?.find((i: any) => i.is_main) || spot.images?.[0]
          return (
            <Link key={spot.id} href={`/spots/${spot.slug}`} style={{ textDecoration: "none" }}>
              <div className="fav-thumb" style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1", background: "#f7f5f0", position: "relative", transition: "transform 0.2s" }}>
                {main ? (
                  <CldImage src={main.cloudinary_public_id} fill style={{ objectFit: "cover" }} alt={spot.name} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏕️</div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 8px 8px", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.2 }}>{spot.name}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
