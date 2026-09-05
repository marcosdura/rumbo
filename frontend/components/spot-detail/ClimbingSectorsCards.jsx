"use client"
import SectorCard from "./SectorCard"

function ClimbingSectorsCards({ sectors, spotSlug }) {
  return (
    <div className="sectors-outer" style={{
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      fontFamily: "var(--font-dm-sans), sans-serif",
    }}>
      <style>{`
        /* ── SectorCard ── */
        .sector-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          height: 100%;
          box-sizing: border-box;
        }
        @media (hover: hover) {
          .sector-card:hover {
            box-shadow: 0 6px 24px rgba(0,0,0,0.09);
            transform: translateY(-2px);
          }
        }
        .sector-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .sector-card-title {
          font-family: var(--font-playfair-display), serif;
          font-size: 18px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0;
        }
        .sector-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .sector-stat-cell {
          background: #f7f5f0;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }
        .sector-stat-val {
          font-size: 15px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0;
          line-height: 1.2;
        }
        .sector-stat-lbl {
          font-size: 10px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 4px 0 0;
        }
        .sector-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        /* ── Grid ── */
        .sectors-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .sector-card-wrap { min-width: 0; }
        .sectors-scroll-end { display: none; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .sectors-outer { overflow: hidden; padding: 20px !important; }

          .sectors-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 12px;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .sectors-grid::-webkit-scrollbar { display: none; }

          .sector-card-wrap {
            flex-shrink: 0;
            width: 240px;
            scroll-snap-align: start;
          }

          .sector-card { padding: 14px; }
          .sector-card-title { font-size: 15px; }
          .sector-card-header { margin-bottom: 12px; }

          .sector-stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
            margin-bottom: 10px;
          }
          .sector-stat-cell { padding: 8px 4px; }
          .sector-stat-val {
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .sector-stat-lbl { font-size: 9px; }

          .sector-badges { gap: 4px; }
          .sectors-scroll-end { display: block; flex-shrink: 0; width: 20px; min-width: 20px; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
          Sectores de Escalada
        </p>
      </div>

      <div className="sectors-grid">
        {sectors.map(sector => (
          <div key={sector.id} className="sector-card-wrap">
            <SectorCard sector={sector} spotSlug={spotSlug} />
          </div>
        ))}
        <div className="sectors-scroll-end" />
      </div>

    </div>
  )
}

export default ClimbingSectorsCards
