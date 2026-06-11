export default function SummaryRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: "#9a9690", minWidth: 84, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1b1b19", fontWeight: 500 }}>{value}</span>
    </div>
  )
}
