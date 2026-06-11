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
    padding: "24px 16px", background: "#fff", border: "1px solid #e0ddd6",
    borderRadius: 20, cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#1b1b19",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    width: "100%", padding: "9px 12px", border: "1px solid #e0ddd6",
    borderRadius: 12, fontSize: 14, background: "#fff", color: "#1b1b19",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  card: {
    background: "#fff", border: "1px solid #e0ddd6", borderRadius: 20,
    padding: "18px 20px", marginBottom: 16,
  },
  cardTitle: { fontWeight: 600, fontSize: 15, color: "#1b1b19", marginBottom: 12 },
  navRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 24, gap: 12,
  },
  btnPrimary: {
    background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 12,
    padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  btnSecondary: {
    background: "#fff", color: "#1b1b19", border: "1px solid #e0ddd6", borderRadius: 12,
    padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  btnAdd: {
    background: "transparent", color: "#2d6a4f", border: "1px solid #2d6a4f", borderRadius: 12,
    padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4,
  },
  dropzone: {
    border: "2px dashed #e0ddd6", borderRadius: 16, padding: "36px 24px",
    textAlign: "center", cursor: "pointer", background: "#fff", marginBottom: 16,
  },
  previewGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  previewImg: { width: 100, height: 80, objectFit: "cover", display: "block" },
  mainBadge: {
    position: "absolute", bottom: 4, left: 4, background: "#2d6a4f",
    color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
  },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 10 },
}
