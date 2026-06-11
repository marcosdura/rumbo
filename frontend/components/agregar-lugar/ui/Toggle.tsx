"use client"

export default function Toggle({
  label, checked, onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label style={{ fontSize: 14, color: "#1b1b19", display: "flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
