import { card } from "@/lib/theme"

export const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre",
]

export const MAX_PHOTOS = 10

export const s = {
  card,
  label: { fontSize: 12, fontWeight: 600 as const, color: "#7a7669", marginBottom: 4, display: "block" as const },
  input: { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e0ddd6", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const, background: "#fff" },
  tab: (active: boolean) => ({
    padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600 as const,
    cursor: "pointer" as const, fontFamily: "inherit",
    border: `1px solid ${active ? "#2d6a4f" : "#e0ddd6"}`,
    background: active ? "#2d6a4f" : "#fff",
    color: active ? "#fff" : "#3d3d3a",
  }),
  pill: (active: boolean, danger = false) => ({
    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500 as const,
    cursor: "pointer" as const, fontFamily: "inherit",
    border: `1px solid ${active ? (danger ? "#dc2626" : "#2d6a4f") : "#e0ddd6"}`,
    background: active ? (danger ? "#dc2626" : "#2d6a4f") : "#f7f5f0",
    color: active ? "#fff" : "#3d3d3a",
  }),
}
