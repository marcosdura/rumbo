"use client"

export default function BinaryToggle({
  value, onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  const opts: { label: string; v: boolean }[] = [
    { label: "Sí", v: true },
    { label: "No", v: false },
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
              padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${active ? "#2d6a4f" : "#e0ddd6"}`,
              background: active ? "#2d6a4f" : "#f7f5f0",
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
