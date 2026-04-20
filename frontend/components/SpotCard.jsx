"use client"


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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .spot-card {
          font-family: 'DM Sans', sans-serif;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .spot-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }

        .spot-card-img-wrap {
          height: 180px;
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
          background: linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 60%);
        }

        .spot-card-body {
          padding: 14px 16px 16px;
        }

        .spot-card-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spot-card-location {
          font-size: 12px;
          color: #9ca3a0;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .spot-card-location::before {
          content: '';
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6ee7b7;
          flex-shrink: 0;
        }

        .spot-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .spot-card-badges {
          display: flex;
          gap: 8px; /* espacio entre badges */
        }

        .spot-card-badge-category {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #d6cebf, #b4aa96);
          color: #4a443b;
          border: 1px solid #b4aa96;
        }

          .spot-card-badge-department {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #4a5650, #2C3932);
          color: #f0f1f0;
          border: 1px solid #4f5853;
        }

        .spot-card-arrow {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #555;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .spot-card:hover .spot-card-arrow {
          background: #c6bdaa;
          border-color: #b4aa96;
          color: white;
          transform: translateX(2px);
        }
      `}</style>

      <div
        className="spot-card"
        onClick={() => window.open(`/spots/${spot.id}`, "_blank")}
      >
        <div className="spot-card-img-wrap">
          <img src={`${image}?w=600&q=80`} loading="lazy" alt={spot.name} />
          <div className="spot-card-img-overlay" />
        </div>

        <div className="spot-card-body">
          <p className="spot-card-name">{spot.name}</p>         

          <div className="spot-card-footer">
            <div className="spot-card-badges">
              <span className="spot-card-badge-category">
                {spot.category?.name || "Sin categoría"}
              </span>

              <span className="spot-card-badge-department">
                {spot.department || "Sin Departamento"}
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