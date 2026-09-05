"use client"

import NavRow from "../ui/NavRow"
import { s } from "../styles"

export default function StepTrekkingMode({
  onSelect, onBack,
}: {
  onSelect: (mode: "new_spot" | "new_route") => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>¿Qué querés agregar?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {[
          { mode: "new_spot" as const, emoji: "🥾", label: "Nuevo spot de trekking", desc: "Agregar un lugar de trekking nuevo" },
          { mode: "new_route" as const, emoji: "🗺️", label: "Nueva ruta", desc: "Agregar una ruta a un spot que ya existe" },
        ].map(opt => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onSelect(opt.mode)}
            style={{
              ...s.card,
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", textAlign: "left", width: "100%",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 32 }}>{opt.emoji}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{opt.label}</p>
              <p style={{ fontSize: 13, color: "var(--muted-strong)", margin: "2px 0 0" }}>{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <NavRow onBack={onBack} />
    </div>
  )
}
