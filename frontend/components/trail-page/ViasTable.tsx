"use client"

// Las vías de un sector. En escalada se dice "vía" (antes la tabla decía
// "rutas" y el botón "Sugerir una vía").
import Pill from "@/components/ui/Pill"
import { gradeVariant } from "@/lib/trailPage"
import type { ClimbingRoute } from "@/lib/types"

const head = { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: 0 } as const

export default function ViasTable({ vias }: { vias: ClimbingRoute[] }) {
  if (vias.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", padding: "24px 0", margin: 0 }}>Todavía no hay vías cargadas en este sector.</p>
  }
  return (
    <div>
      <style>{`
        .via-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 2fr; gap: 16px; padding: 12px 16px; border-radius: 12px; align-items: center; transition: background 0.15s; }
        .via-row:hover { background: #f7f5f0; }
        @media (max-width: 640px) {
          .via-row { grid-template-columns: 2fr 1fr 1fr; }
          .via-col-length, .via-col-desc { display: none; }
        }
      `}</style>
      <div className="via-row" style={{ borderBottom: "1px solid #ede9e1", borderRadius: 0, paddingTop: 0 }}>
        <p style={head}>Nombre</p>
        <p style={head}>Grado</p>
        <p style={head}>Chapas</p>
        <p className="via-col-length" style={head}>Largo</p>
        <p className="via-col-desc" style={head}>Descripción</p>
      </div>
      {vias.map((v, i) => (
        <div key={v.id} className="via-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: "#d0cdc7", fontFamily: "monospace", width: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19", margin: 0 }}>{v.name}</p>
          </div>
          <div>{v.grade ? <Pill variant={gradeVariant(v.grade)}>{v.grade}</Pill> : <span style={{ color: "var(--muted)" }}>—</span>}</div>
          <p style={{ fontSize: 14, color: "#3d3d3a", margin: 0 }}>{v.bolts ?? "—"}</p>
          <p className="via-col-length" style={{ fontSize: 14, color: "#3d3d3a", margin: 0 }}>{v.length ? `${v.length} m` : "—"}</p>
          <p className="via-col-desc" style={{ fontSize: 13, color: "var(--muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {v.description || "—"}
          </p>
        </div>
      ))}
    </div>
  )
}
