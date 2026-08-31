"use client"

import NavRow from "../ui/NavRow"
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
              ...s.card,
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", textAlign: "left", width: "100%",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 32 }}>{m.emoji}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{m.title}</p>
              <p style={{ fontSize: 13, color: "#7a7669", margin: "2px 0 0" }}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <NavRow onBack={onBack} />
    </div>
  )
}
