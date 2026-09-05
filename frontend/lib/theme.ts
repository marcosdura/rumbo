import type { CSSProperties } from "react"

// Estilo de "card" (fondo blanco, borde neutro, radio 20px, sombra suave)
// repetido idéntico en varios lugares del sitio — el caso más claro era
// profile/styles.ts y dashboard/spots/[id]/styles.ts, byte a byte iguales.
export const card: CSSProperties = {
  background: "#fff",
  border: "1px solid var(--border)",
  borderRadius: 20,
  boxShadow: "var(--shadow-card)",
}

// Label / input / tab / pill: venían de dashboard/spots/[id]/styles.ts, que
// era el único lugar que los tenía escritos. Viven acá porque el panel admin
// también los necesita — antes los repetía inline con valores propios
// (radios 10 y 12 mezclados, activo en --primary-dark en vez de --primary).
export const label: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#7a7669", marginBottom: 4, display: "block",
}

export const input: CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit",
  boxSizing: "border-box", background: "#fff",
}

export const tab = (active: boolean): CSSProperties => ({
  padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
  border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
  background: active ? "var(--primary)" : "#fff",
  color: active ? "#fff" : "#3d3d3a",
})

export const pill = (active: boolean, danger = false): CSSProperties => ({
  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit",
  border: `1px solid ${active ? (danger ? "var(--danger)" : "var(--primary)") : "var(--border)"}`,
  background: active ? (danger ? "var(--danger)" : "var(--primary)") : "#f7f5f0",
  color: active ? "#fff" : "#3d3d3a",
})
