"use client"

import { s } from "./styles"
import type { Review } from "./types"

interface Props {
  reviews: Review[]
}

export default function ReviewsTab({ reviews }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {reviews.length === 0 ? (
        <div style={{ ...s.card, padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#9a9690", margin: 0 }}>Todavía no hay reseñas para este spot.</p>
        </div>
      ) : reviews.map(review => (
        <div key={review.id} style={{ ...s.card, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#f7f5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              {review.user.image
                ? <img src={review.user.image} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : "👤"
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1b1b19", margin: "0 0 2px" }}>
                {review.user.name ?? "Usuario"}
              </p>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 13, color: n <= review.rating ? "#f59e0b" : "#e0ddd6" }}>★</span>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#9a9690", flexShrink: 0 }}>
              {new Date(review.created_at).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          {review.comment && (
            <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0, lineHeight: 1.6 }}>{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
