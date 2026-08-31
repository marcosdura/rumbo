import { card } from "@/lib/theme"

export const s = {
  card,
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "#f7f5f0", border: "1px solid #e0ddd6",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, flexShrink: 0,
  },
  infoLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "#2d6a4f", marginBottom: 2,
  },
  infoValue: {
    fontSize: 14, color: "#1b1b19", fontWeight: 400,
  },
  statNumber: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28, fontWeight: 600, color: "#1b1b19",
    lineHeight: 1, marginBottom: 4,
  },
  statLabel: {
    fontSize: 11, color: "#9a9690", fontWeight: 600,
    letterSpacing: "0.08em", textTransform: "uppercase",
  },
  actionBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 14px", borderRadius: 12,
    fontSize: 14, fontWeight: 400,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    border: "1px solid #e0ddd6",
    background: "#fff",
    color: "#3d3d3a",
    width: "100%", textAlign: "left" as const,
    textDecoration: "none",
  },
  actionBtnIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: "#f7f5f0", border: "1px solid #e0ddd6",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, flexShrink: 0,
  },
}
