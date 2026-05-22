"use client"
import RouteCard from "./RouteCard"

function TrekkingRoutes({ routes }) {
  return (
    <div className="routes-outer" style={{
      background: "#fff",
      border: "1px solid #e0ddd6",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        /* ── RouteCard ── */
        .route-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 16px;
          padding: 20px;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          height: 100%;
          box-sizing: border-box;
        }
        @media (hover: hover) {
          .route-card:hover {
            box-shadow: 0 6px 24px rgba(0,0,0,0.09);
            transform: translateY(-2px);
          }
        }
        .route-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .route-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0;
        }
        .route-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .route-stat-cell {
          background: #f7f5f0;
          border: 1px solid #e0ddd6;
          border-radius: 12px;
          padding: 10px 6px;
          text-align: center;
        }
        .route-stat-val {
          font-size: 13px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0;
          line-height: 1.2;
        }
        .route-stat-lbl {
          font-size: 10px;
          font-weight: 600;
          color: #9a9690;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 4px 0 0;
        }
        .route-alt-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .route-alt-cell {
          flex: 1;
          background: #f7f5f0;
          border: 1px solid #e0ddd6;
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .route-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        /* ── Grid ── */
        .routes-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .route-card-wrap { min-width: 0; }
        .routes-scroll-end { display: none; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .routes-outer { overflow: hidden; padding: 20px !important; }

          .routes-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 12px;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .routes-grid::-webkit-scrollbar { display: none; }

          .route-card-wrap {
            flex-shrink: 0;
            width: 270px;
            scroll-snap-align: start;
          }

          .route-card { padding: 14px; }
          .route-card-title { font-size: 15px; }
          .route-card-header { margin-bottom: 12px; }

          /* 4 stats → 2×2 grid */
          .route-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            margin-bottom: 8px;
          }
          .route-stat-cell { padding: 8px 6px; }
          .route-stat-val { font-size: 12px; }
          .route-stat-lbl { font-size: 9px; }

          .route-alt-row { gap: 6px; margin-bottom: 8px; }
          .route-alt-cell { padding: 7px 8px; gap: 6px; }
          .route-badges { gap: 4px; }
          .routes-scroll-end { display: block; flex-shrink: 0; width: 20px; min-width: 20px; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
          Rutas de Trekking
        </p>
      </div>

      <div className="routes-grid">
        {routes.map(route => (
          <div key={route.id} className="route-card-wrap">
            <RouteCard route={route} />
          </div>
        ))}
        <div className="routes-scroll-end" />
      </div>

    </div>
  )
}

export default TrekkingRoutes
