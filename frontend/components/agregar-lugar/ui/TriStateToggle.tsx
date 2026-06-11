"use client"

export default function TriStateToggle({
  value, onChange,
}: {
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  const opts: { label: string; v: boolean | null; activeColor: string; activeBg: string }[] = [
    { label: "Sí",    v: true,  activeColor: "#2d6a4f", activeBg: "#2d6a4f" },
    { label: "No",    v: false, activeColor: "#dc2626", activeBg: "#dc2626" },
    { label: "No sé", v: null,  activeColor: "#7a7669", activeBg: "#7a7669" },
  ]
  return (
    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
      {opts.map(opt => {
        const active = value === opt.v
        return (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${active ? opt.activeBg : "#e0ddd6"}`,
              background: active ? opt.activeBg : "#f7f5f0",
              color: active ? "#fff" : "#9a9690",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
