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
