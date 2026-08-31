"use client"

export default function SummaryCard({
  title, onEdit, children,
}: {
  title: string
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border)", borderRadius: 20,
      padding: "16px 20px", marginBottom: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>
            {title}
          </span>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              background: "none", border: "1px solid var(--border)", padding: "3px 10px",
              fontSize: 12, color: "#7a7669", cursor: "pointer",
              fontFamily: "inherit", borderRadius: 8,
            }}
          >
            Editar
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
