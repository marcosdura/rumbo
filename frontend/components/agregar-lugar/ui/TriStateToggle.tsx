"use client"

export default function TriStateToggle({
  value, onChange,
}: {
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  const opts: { label: string; v: boolean | null; activeColor: string; activeBg: string }[] = [
    { label: "Sí",    v: true,  activeColor: "var(--primary)", activeBg: "var(--primary)" },
    { label: "No",    v: false, activeColor: "var(--danger)", activeBg: "var(--danger)" },
    { label: "No sé", v: null,  activeColor: "var(--muted-strong)", activeBg: "var(--muted-strong)" },
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
              border: `1px solid ${active ? opt.activeBg : "var(--border)"}`,
              background: active ? opt.activeBg : "#f7f5f0",
              color: active ? "#fff" : "var(--muted)",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
