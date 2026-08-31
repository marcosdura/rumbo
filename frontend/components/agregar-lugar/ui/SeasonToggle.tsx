"use client"

import { MONTHS } from "../constants"
import Field from "./Field"
import { s } from "../styles"

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select style={s.input} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-</option>
      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
  )
}

export default function SeasonToggle({
  type, onTypeChange, start, onStartChange, end, onEndChange,
}: {
  type: "all_year" | "seasonal"
  onTypeChange: (t: "all_year" | "seasonal") => void
  start: string; onStartChange: (v: string) => void
  end: string; onEndChange: (v: string) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#1b1b19", marginBottom: 8 }}>
        Temporada{" "}
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>(opcional)</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: type === "seasonal" ? 12 : 0 }}>
        {(["all_year", "seasonal"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            style={{
              padding: "6px 16px", borderRadius: 20,
              border: `1px solid ${type === t ? "var(--primary)" : "var(--border)"}`,
              background: type === t ? "var(--primary)" : "#f7f5f0",
              color: type === t ? "#fff" : "#1b1b19",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t === "all_year" ? "Todo el año" : "Por temporada"}
          </button>
        ))}
      </div>
      {type === "seasonal" && (
        <div className="form-two-col">
          <Field label="Desde" required={false}>
            <MonthSelect value={start} onChange={onStartChange} />
          </Field>
          <Field label="Hasta" required={false}>
            <MonthSelect value={end} onChange={onEndChange} />
          </Field>
        </div>
      )}
    </div>
  )
}
