"use client"

import FavoriteButton from "@/components/FavoriteButton"

const IMAGES = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
]

function SpotCard({ spot, index = 0 }) {
  const image = IMAGES[index % IMAGES.length]

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
                      box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .spot-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }

        .spot-card-img-wrap {
          height: 200px;
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

        .spot-card-body {
          padding: 14px 16px 16px;
        }

        .spot-card-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0 0 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spot-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .spot-card-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .spot-card-badge-category {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
          background: #eae6df;
          color: #4a443b;
          border: 1px solid #d0c9bc;
          letter-spacing: 0.03em;
        }

        .spot-card-badge-department {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
          background: #1b4332;
          color: #d8f3dc;
          border: 1px solid #2d6a4f;
          letter-spacing: 0.03em;
        }

        .spot-card-arrow {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid #e0ddd6;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #9a9690;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .spot-card:hover .spot-card-arrow {
          background: #1b4332;
          border-color: #1b4332;
          color: #fff;
          transform: translateX(2px);
        }

        .spot-card-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }
      `}</style>

      <div
        className="spot-card"
        onClick={() => window.open(`/spots/${spot.id}`, "_blank")}
      >
        {/* Imagen */}
        <div className="spot-card-img-wrap">
          <img src={`${image}?w=600&q=80`} loading="lazy" alt={spot.name} />
          <div className="spot-card-img-overlay" />
          <div
            style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <FavoriteButton spot={spot} variant="card" />
          </div>
        </div>

        {/* Body */}
        <div className="spot-card-body">
          <p className="spot-card-name">{spot.name}</p>

          <div className="spot-card-footer">
            <div className="spot-card-badges">
              <span className="spot-card-badge-category">
                {spot.category?.name || "Sin categoría"}
              </span>
              <span className="spot-card-badge-department">
                {spot.department || "Sin departamento"}
              </span>
            </div>
            <span className="spot-card-arrow">→</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default SpotCard