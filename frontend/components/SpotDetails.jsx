function SpotDetails({ spot }) {
  const rows = [
    { label: "Departamento", value: spot.department },
    { label: "Categoría",    value: spot.category?.name || "—" },
    { label: "Precio",       value: spot.camping_detail?.price ? `${spot.camping_detail.price} UY` : "—" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#2d6a4f",
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#2d6a4f",
            margin: 0,
          }}
        >
          Detalles
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 10px",
              borderTop: i === 0 ? "1px solid #ede9e1" : "none",
              borderBottom: "1px solid #ede9e1",
              borderRadius: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f7f5f0"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 14, color: "#7a7669", fontWeight: 400 }}>
              {row.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpotDetails;