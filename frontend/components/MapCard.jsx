function MapCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0ddd6",
        borderRadius: 20,
        padding: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#2d6a4f",
            flexShrink: 0,
          }}
        />
        <h3
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#2d6a4f",
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Ubicación
        </h3>
      </div>

      <div
        style={{
          flex: 1,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #e0ddd6",
          minHeight: 180,
        }}
      >
        <iframe
          loading="lazy"
          width="100%"
          height="100%"
          style={{ display: "block", height: "100%", minHeight: 180 }}
          src="https://www.google.com/maps?q=-34.906,-56.164&output=embed"
        />
      </div>

      <button
        style={{
          marginTop: 14,
          width: "100%",
          background: "#1b4332",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
          padding: "11px 0",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s, transform 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "#2d6a4f";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "#1b4332";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Cómo llegar →
      </button>
    </div>
  );
}

export default MapCard;