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
    : "Información no disponible";

  const hasContact = spot.email || spot.whatsapp || spot.instagram;

  const rows = [
  { label: "Departamento", value: spot.department || "—" },
  { label: "Categoría",    value: spot.category?.name || "—" },
  { label: "Precio",       value: price },
  { label: "Temporada",    value: getSeason(spot.season_start, spot.season_end) },
  ];

  const DotHeader = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
      <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
        Detalles
      </h2>
    </div>
  );

  const ContactHeader = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 28 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
      <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
        Contacto
      </h2>
    </div>
  );

  const labelStyle = { fontSize: 14, color: "#7a7669", fontWeight: 400, display: "flex", alignItems: "center", gap: 6 };
  const valueStyle = { fontSize: 14, fontWeight: 600, color: "#1b1b19" };
  const dimValueStyle = { fontSize: 14, fontWeight: 400, color: "#b0ac9e", fontStyle: "italic" };
  const linkStyle = { fontSize: 14, fontWeight: 600, color: "#2d6a4f", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 };

  const whatsappNumber = spot.whatsapp ? spot.whatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = "https://wa.me/" + whatsappNumber;
  const instagramHandle = spot.instagram ? spot.instagram.replace(/^@/, "") : "";
  const instagramUrl = "https://instagram.com/" + instagramHandle;

  const contactRows = [
    spot.email
      ? {
          label: <><span>✉️</span><span>Email</span></>,
          node: (
            <span
              onClick={() => {
                navigator.clipboard.writeText(spot.email)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              style={{ ...linkStyle, cursor: "pointer" }}
              title="Copiar email"
            >
              {copied ? "¡Copiado! ✓" : spot.email}
            </span>
          ),
        }
      : null,
    spot.whatsapp
      ? {
          label: <><span>💬</span><span>WhatsApp</span></>,
          node: (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              <span>{spot.whatsapp}</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
            </a>
          ),
        }
      : null,
    spot.instagram
      ? {
          label: <><span>📷</span><span>Instagram</span></>,
          node: (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              <span>{"@" + instagramHandle}</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>↗</span>
            </a>
          ),
        }
      : null,
  ].filter(Boolean);

  const rowBase = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 10px",
    borderBottom: "1px solid #ede9e1",
    transition: "background 0.15s",
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <DotHeader />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{ ...rowBase, borderTop: i === 0 ? "1px solid #ede9e1" : "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f7f5f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={labelStyle}>{row.label}</span>
            <span style={row.value === "Información no disponible" ? dimValueStyle : valueStyle}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <ContactHeader />

      {hasContact ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {contactRows.map((row, i) => (
            <div
              key={i}
              style={{ ...rowBase, borderTop: i === 0 ? "1px solid #ede9e1" : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f7f5f0"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={labelStyle}>{row.label}</span>
              {row.node}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "11px 10px", borderTop: "1px solid #ede9e1", borderBottom: "1px solid #ede9e1" }}>
          <span style={dimValueStyle}>No hay información de contacto disponible.</span>
        </div>
      )}
    </div>
  );
}

export default SpotDetails;