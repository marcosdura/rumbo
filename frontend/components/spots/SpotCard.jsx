"use client"

import { useState } from "react"
import FavoriteButton from "@/components/spot-detail/FavoriteButton"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"
import { CldImage } from 'next-cloudinary'

function SpotCard({ spot, isHighlighted = false }) {
  const [hovered, setHovered] = useState(false)
  const mainImage = spot.images?.find(img => img.is_main) ?? spot.images?.[0]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .spot-card {
          font-family: 'DM Sans', sans-serif;
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .spot-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .spot-card.highlighted {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .spot-card-img-wrap {
          height: 160px;
          overflow: hidden;
          position: relative;
        }
        .spot-card-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .spot-card:hover .spot-card-img-wrap img {
          transform: scale(1.07);
        }

        .spot-card-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 55%);
        }

        .spot-card-body { padding: 10px 12px 12px; }

        .spot-card-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0 0 3px;
        }

        .spot-card-rating {
          font-size: 13px;
          color: #7a7669;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .spot-card-rating .star { color: #2d6a4f; }

        .spot-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .spot-card-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .dept-pill {
          min-width: 0;
          overflow: hidden;
          flex-shrink: 1;
        }
        .dept-pill-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }

        @media (max-width: 480px) {
          .spot-card-img-wrap { height: 120px; }
          .spot-card-name     { font-size: 13px; }
          .spot-card-body     { padding: 8px 10px 10px; }
          .spot-card-badges   { flex-wrap: nowrap; overflow: hidden; }
        }
      `}</style>

      <div
        className={`spot-card${isHighlighted ? " highlighted" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => window.open(`/spots/${spot.slug}`, "_blank")}
      >
        <div className="spot-card-img-wrap">
          {mainImage ? (
            <CldImage
              src={mainImage.cloudinary_public_id}
              width={600}
              height={200}
              crop="fill"
              gravity="auto"
              alt={spot.name}
              loading="lazy"
              quality="auto"
              format="auto"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#e0ddd6" }} />
          )}
          <div className="spot-card-img-overlay" />
          <div
            style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <FavoriteButton spot={spot} variant="card" />
          </div>
        </div>

        <div className="spot-card-body">
          <p className="spot-card-name">{spot.name}</p>
          {spot.review_count > 0 && (
            <p className="spot-card-rating">
              <span className="star">★</span>
              <span>{spot.average_rating} · {spot.review_count} reseña{spot.review_count !== 1 ? "s" : ""}</span>
            </p>
          )}
          <div className="spot-card-footer">
            <div className="spot-card-badges">
              <Pill variant="beige">{spot.category?.name || "Sin categoría"}</Pill>
              <Pill variant="dark-green" style={{ minWidth: 0, overflow: "hidden", flexShrink: 1 }}>
                <span className="dept-pill-text">{spot.department || "Sin departamento"}</span>
              </Pill>
            </div>
            <CircleArrow active={hovered} />
          </div>
        </div>
      </div>
    </>
  )
}

export default SpotCard