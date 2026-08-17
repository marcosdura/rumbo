"use client"

interface Props {
  uploadProgress: string | null
}

export default function SubmittingOverlay({ uploadProgress }: Props) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 40px",
        maxWidth: 380, width: "90%", textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "4px solid #e0ddd6",
          borderTopColor: "#2d6a4f",
          margin: "0 auto 20px",
          animation: "spin 0.9s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#1b1b19", margin: "0 0 8px" }}>
          Enviando tu lugar...
        </p>
        <p style={{ fontSize: 13, color: "#7a7669", margin: "0 0 16px", lineHeight: 1.5 }}>
          {uploadProgress ?? "Procesando..."}
        </p>
        <div style={{
          background: "#fef3cd", border: "1px solid #f0d98a",
          borderRadius: 10, padding: "10px 14px",
          fontSize: 12, color: "#78590a", lineHeight: 1.5,
        }}>
          ⚠️ No cierres esta página hasta que termine el proceso.
        </div>
      </div>
    </div>
  )
}
