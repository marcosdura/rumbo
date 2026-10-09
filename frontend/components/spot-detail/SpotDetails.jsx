import { useState } from "react"
import { detailRows } from "@/lib/spotDetail"
import { knownPractical } from "@/lib/practicalInfo"
import PracticalInfoCard from "./PracticalInfoCard"

// Panel derecho de la página del lugar: Detalles (precio, temporada,
// transporte), Información práctica y Contacto, en ese orden. Solo lo que se
// sabe; departamento, categoría y acceso ya están en el encabezado y el banner.
export function SectionLabel({ children, first = false }) {
  return (
    <div className={first ? "detail-section-label" : "detail-contact-label"}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
      <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
        {children}
      </h2>
    </div>
  )
}

function SpotDetails({ spot }) {
  const [copied, setCopied] = useState(false)
  const rows = detailRows(spot)
  const hasPractical = knownPractical(spot).length > 0
  const hasContact = spot.email || spot.whatsapp || spot.instagram

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
          color: var(--muted-strong);
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
          color: var(--primary);
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

      <div style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>

        {rows.length > 0 && (
          <>
            <SectionLabel first>Detalles</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((row, i) => (
                <div
                  key={row.label}
                  className="detail-row"
                  style={{ borderTop: i === 0 ? "1px solid #ede9e1" : "none" }}
                >
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {hasPractical && (
          <>
            <SectionLabel first={rows.length === 0}>Información práctica</SectionLabel>
            <PracticalInfoCard info={spot} />
          </>
        )}

        <SectionLabel first={rows.length === 0 && !hasPractical}>Contacto</SectionLabel>

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
