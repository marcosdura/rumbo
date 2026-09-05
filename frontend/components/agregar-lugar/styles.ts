import type { CSSProperties } from "react"

export const mediaQuery = `
  .form-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 560px) {
    .form-two-col { grid-template-columns: 1fr; }
  }
`

export const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f5f0",
    display: "flex",
    justifyContent: "center",
    padding: "32px 16px 80px",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  container: { width: "100%", maxWidth: 680 },
  title: { fontSize: 22, fontWeight: 600, color: "#1b1b19", marginBottom: 20 },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 16,
  },
  catCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "24px 16px", background: "#fff", border: "1px solid var(--border)",
    borderRadius: 20, cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#1b1b19",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid var(--border)",
    borderRadius: 12, fontSize: 14, background: "#fff", color: "#1b1b19",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  card: {
    background: "#fff", border: "1px solid var(--border)", borderRadius: 20,
    padding: "18px 20px", marginBottom: 16,
  },
  cardTitle: { fontWeight: 600, fontSize: 15, color: "#1b1b19", marginBottom: 12 },
  navRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 24, gap: 12,
  },
  btnPrimary: {
    background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12,
    padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  btnSecondary: {
    background: "#fff", color: "#1b1b19", border: "1px solid var(--border)", borderRadius: 12,
    padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  btnAdd: {
    background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)", borderRadius: 12,
    padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4,
  },
  dropzone: {
    border: "2px dashed var(--border)", borderRadius: 16, padding: "36px 24px",
    textAlign: "center", cursor: "pointer", background: "#fff", marginBottom: 16,
  },
  previewGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  previewImg: { width: 100, height: 80, objectFit: "cover", display: "block" },
  mainBadge: {
    position: "absolute", bottom: 4, left: 4, background: "var(--primary)",
    color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
  },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 10 },
  subtitle: { fontSize: 13, color: "var(--muted-strong)", marginBottom: 16 },
  deleteBtn: {
    position: "absolute", top: 10, right: 10,
    background: "#fdf0f0", border: "1px solid #f5c0c0", color: "#c0392b",
    borderRadius: "50%", width: 28, height: 28,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 16, fontWeight: 700, lineHeight: 1,
  },
}

export function amenityChipStyle(selected: boolean): CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 5,
    padding: "6px 12px", borderRadius: 20,
    border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
    background: selected ? "var(--primary)" : "#f7f5f0",
    color: selected ? "#fff" : "#1b1b19",
    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  }
}

export function errorRowStyle(hasError: boolean): CSSProperties {
  return {
    background: hasError ? "#fff5f5" : "transparent",
    border: hasError ? "1px solid #fecaca" : "1px solid transparent",
    borderRadius: 10,
    transition: "background 0.15s, border-color 0.15s",
  }
}

export const errorRowTextColor = (hasError: boolean) => (hasError ? "var(--danger)" : "#1b1b19")

export const errorInputBorder: CSSProperties = { borderColor: "#e53e3e" }

export const errorHintText: CSSProperties = { fontSize: 12, color: "#e53e3e", margin: "4px 0 0" }

export function sanitizeNum(v: string): string {
  return v.replace(/-/g, "")
}
