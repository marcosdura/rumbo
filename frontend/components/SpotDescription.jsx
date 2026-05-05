function SpotDescription({ description }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0ddd6",
        borderRadius: 20,
        padding: "24px 28px",
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
        <h2
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
          Descripción
        </h2>
      </div>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: "#2c2c2a",
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default SpotDescription;