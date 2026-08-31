import Navbar from "@/components/layout/Navbar"

export default function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); opacity: 0.35; }
            50%       { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%", background: "var(--primary)",
              animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
