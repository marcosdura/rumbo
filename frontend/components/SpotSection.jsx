import SpotList from "@/components/SpotList"

export default function SpotSection({ label, title, count, spots, loading }) {
  return (
    <section style={{ paddingTop: 40, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a4f", flexShrink: 0 }} />
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2d6a4f", margin: 0 }}>
            {label}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30, fontWeight: 600,
            color: "#1b1b19", margin: 0, lineHeight: 1.2,
          }}>
            {title}
          </h2>
          {count > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 600,
              padding: "3px 12px", borderRadius: 999,
              background: "#1b4332", color: "#d8f3dc",
              border: "1px solid #2d6a4f",
              letterSpacing: "0.03em",
              flexShrink: 0,
            }}>
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: "#e0ddd6",
        marginBottom: 20,
      }} />

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              height: 240, borderRadius: 20,
              background: "#ede9e1",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          <SpotList spots={spots} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  )
}