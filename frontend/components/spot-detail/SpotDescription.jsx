function SpotDescription({ description }) {
  return (
    <>
      <style>{`
        .spot-desc-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          font-family: 'DM Sans', sans-serif;
        }
        @media (max-width: 768px) {
          .spot-desc-card { padding: 20px 16px; }
        }
      `}</style>
      <div className="spot-desc-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
          <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
            Descripción
          </h2>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "#2c2c2a", margin: 0, fontWeight: 400 }}>
          {description}
        </p>
      </div>
    </>
  )
}

export default SpotDescription
