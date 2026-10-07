"use client"

// Elegir varias opciones (niveles, idiomas...) o "No sé". value null = no sé;
// sacar la última opción elegida vuelve a "No sé".
export default function MultiChoiceUnknown({ options, value, onChange, label }: {
  options: Record<string, string>
  value: string[] | null
  onChange: (v: string[] | null) => void
  label: string
}) {
  const chosen = value ?? []

  function toggle(key: string) {
    const next = chosen.includes(key) ? chosen.filter(k => k !== key) : [...chosen, key]
    onChange(next.length > 0 ? next : null)
  }

  const chip = (active: boolean) => ({
    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
    background: active ? "var(--primary)" : "#f7f5f0",
    color: active ? "#fff" : "var(--muted)",
  })

  return (
    <div role="group" aria-label={label} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Object.entries(options).map(([key, text]) => (
        <button key={key} type="button" aria-pressed={chosen.includes(key)} onClick={() => toggle(key)} style={chip(chosen.includes(key))}>
          {text}
        </button>
      ))}
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)}
        style={{ ...chip(value === null), ...(value === null ? { background: "var(--muted-strong)", borderColor: "var(--muted-strong)" } : {}) }}>
        No sé
      </button>
    </div>
  )
}
