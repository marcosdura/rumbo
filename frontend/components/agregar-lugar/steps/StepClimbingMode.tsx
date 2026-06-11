"use client"

import { s } from "../styles"

const MODES = [
  { key: "new_spot"    as const, emoji: "🧗", title: "Nuevo spot de escalada", desc: "Agregar un lugar de escalada nuevo" },
  { key: "new_sector"  as const, emoji: "📍", title: "Nuevo sector",           desc: "Agregar un sector a un spot que ya existe" },
  { key: "new_route"   as const, emoji: "🪨", title: "Nueva ruta",             desc: "Agregar una ruta a un sector existente" },
]

export default function StepClimbingMode({
  onSelect, onBack,
}: {
  onSelect: (mode: "new_spot" | "new_sector" | "new_route") => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>¿Qué querés agregar?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {MODES.map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            style={{
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              textAlign: "left", background: "#fff", border: "1.5px solid #e0ddd6",
              borderRadius: 14, padding: "16px 18px", width: "100%",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{m.emoji}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#1b1b19" }}>{m.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#7a7669" }}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <button style={s.btnSecondary} onClick={onBack}>Volver</button>
    </div>
  )
}
