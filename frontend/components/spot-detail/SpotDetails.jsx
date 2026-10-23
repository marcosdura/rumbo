import { detailRows, whatsappUrl } from "@/lib/spotDetail"
import { knownPractical } from "@/lib/practicalInfo"
import PracticalInfoCard from "./PracticalInfoCard"
import EmailContact from "@/components/ui/EmailContact"

// La card de la página del lugar con Detalles (precio, temporada,
// transporte), Información práctica y Contacto, en tres columnas. Solo lo que se
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
  const rows = detailRows(spot)
  const hasPractical = knownPractical(spot).length > 0
  const hasContact = spot.email || spot.whatsapp || spot.instagram

  const instagramHandle = spot.instagram ? spot.instagram.replace(/^@/, "") : ""
  const instagramUrl = "https://instagram.com/" + instagramHandle

  const contactRows = [
    spot.email ? {
      label: <><span>✉️</span><span>Email</span></>,
      node: <EmailContact email={spot.email} linkClassName="detail-link" />,
    } : null,
    spot.whatsapp ? {
      label: <><span>💬</span><span>WhatsApp</span></>,
      node: (
        <a href={whatsappUrl(spot.whatsapp, spot.name)} target="_blank" rel="noopener noreferrer" className="detail-link">
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
          /* Antes #b0ac9e: contraste 2,3 a 1, ilegible para muchos. */
          color: var(--muted);
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
          /* Corta solo si no entra de otra forma (break-all cortaba en
             cualquier letra aunque hubiera un lugar mejor, como la @). */
          overflow-wrap: anywhere;
        }

        /* Detalles · Información práctica · Contacto, una al lado de la otra
           (en el celular, una debajo de la otra). */
        .detail-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 28px 40px;
          align-items: start;
        }

        @media (max-width: 480px) {
          .detail-label { font-size: 13px; }
          .detail-value, .detail-value-dim, .detail-link { font-size: 13px; }
        }
      `}</style>

      <div className="detail-columns" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>

        {rows.length > 0 && (
          <div>
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
          </div>
        )}

        {hasPractical && (
          <div>
            <SectionLabel first>Información práctica</SectionLabel>
            <PracticalInfoCard info={spot} />
          </div>
        )}

        <div>
        <SectionLabel first>Contacto</SectionLabel>

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

      </div>
    </>
  )
}

export default SpotDetails
