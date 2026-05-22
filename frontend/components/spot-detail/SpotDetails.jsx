import { useState } from "react"

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function getSeason(start, end) {
  if (!start && !end) return "Todo el año"
  return `${MESES[start - 1]} – ${MESES[end - 1]}`
}

function SpotDetails({ spot }) {
  const [copied, setCopied] = useState(false)

  const price = spot.price != null
    ? "$" + spot.price + " UYU"
    : "Información no disponible"

  const hasContact = spot.email || spot.whatsapp || spot.instagram

  const rows = [
    { label: "Departamento", value: spot.department || "—" },
    { label: "Categoría",    value: spot.category?.name || "—" },
    { label: "Precio",       value: price },
    { label: "Temporada",    value: getSeason(spot.season_start, spot.season_end) },
  ]

  const whatsappNumber = spot.whatsapp ? spot.whatsapp.replace(/\D/g, "") : ""
  const whatsappUrl = "https://wa.me/" + whatsappNumber
  const instagramHandle = spot.instagram ? spot.instagram.replace(/^@/, "") : ""
  const instagramUrl = "https://instagram.com/" + instagramHandle

  const contactRows = [
    spot.email ? {
      label: <><span>✉️</span><span>Email</span></>,
      node: (
        <span
          onClick={() => { navigator.clipboard.writeText(spot.email); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="detail-link"
          title="Copiar email"
        >
          {copied ? "¡Copiado! ✓" : spot.email}
        </span>
      ),
    } : null,
    spot.whatsapp ? {
      label: <><span>💬</span><span>WhatsApp</span></>,
      node: (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
          <span>{spot.whatsapp}</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
        </a>
      ),
    } : null,
    spot.instagram ? {
      label: <><span>📷</span><span>Instagram</span></>,
      node: (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
          <span>{"@" + instagramHandle}</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
        </a>
      ),
    } : null,
  ].filter(Boolean)

  return (
    <>
      <style>{`
        .detail-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .detail-contact-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          margin-top: 28px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 10px;
          border-bottom: 1px solid #ede9e1;
          transition: background 0.15s;
          gap: 12px;
        }
        @media (hover: hover) {
          .detail-row:hover { background: #f7f5f0; }
        }

        .detail-label {
          font-size: 14px;
          color: #7a7669;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1b1b19;
          text-align: right;
          min-width: 0;
          word-break: break-word;
        }
        .detail-value-dim {
          font-size: 14px;
          font-weight: 400;
          color: #b0ac9e;
          font-style: italic;
          text-align: right;
          min-width: 0;
        }
        .detail-link {
          font-size: 14px;
          font-weight: 600;
          color: #2d6a4f;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          text-align: right;
          min-width: 0;
          word-break: break-all;
        }

        @media (max-width: 480px) {
          .detail-label { font-size: 13px; }
          .detail-value, .detail-value-dim, .detail-link { font-size: 13px; }
        }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Detalles */}
        <div className="detail-section-label">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
            Detalles
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((row, i) => (
            <div
              key={i}
              className="detail-row"
              style={{ borderTop: i === 0 ? "1px solid #ede9e1" : "none" }}
            >
              <span className="detail-label">{row.label}</span>
              <span className={row.value === "Información no disponible" ? "detail-value-dim" : "detail-value"}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Contacto */}
        <div className="detail-contact-label">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
            Contacto
          </h2>
        </div>

        {hasContact ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {contactRows.map((row, i) => (
              <div
                key={i}
                className="detail-row"
                style={{ borderTop: i === 0 ? "1px solid #ede9e1" : "none" }}
              >
                <span className="detail-label">{row.label}</span>
                {row.node}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "11px 10px", borderTop: "1px solid #ede9e1", borderBottom: "1px solid #ede9e1" }}>
            <span className="detail-value-dim">No hay información de contacto disponible.</span>
          </div>
        )}

      </div>
    </>
  )
}

export default SpotDetails
