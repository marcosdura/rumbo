// En la página del lugar: mascotas, reserva y señal (solo lo que se sabe).
import { knownPractical, type PracticalInfo } from "@/lib/practicalInfo"

export default function PracticalInfoCard({ info }: { info: PracticalInfo }) {
  const items = knownPractical(info)
  if (items.length === 0) return null
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", fontFamily: "var(--font-dm-sans), sans-serif",
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: "0 0 12px" }}>
        Información práctica
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <li key={item.key} style={{ fontSize: 14, color: item.value ? "#1b1b19" : "var(--muted-strong)", display: "flex", gap: 8 }}>
            <span aria-hidden="true">{item.emoji}</span>{item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
