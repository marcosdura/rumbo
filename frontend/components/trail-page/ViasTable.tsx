"use client"

// Las vías de un sector. Tocar una fila la abre ahí mismo: descripción
// completa y sus fotos, con el botón para subir (antes la descripción se
// cortaba y en el celular no se veía). En escalada se dice "vía" (antes la
// tabla decía "rutas" y el botón "Sugerir una vía").
import { Fragment, useState } from "react"
import Pill from "@/components/ui/Pill"
import ItemPhotos from "./ItemPhotos"
import { gradeVariant, type Via } from "@/lib/trailPage"

const head = { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: 0 } as const

export default function ViasTable({ vias, spotId }: { vias: Via[]; spotId: number }) {
  const [openId, setOpenId] = useState<number | null>(null)

  if (vias.length === 0) {
    return <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", padding: "24px 0", margin: 0 }}>Todavía no hay vías cargadas en este sector.</p>
  }
  return (
    <div>
      <style>{`
        .via-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 2fr 24px; gap: 16px; padding: 12px 16px; border-radius: 12px; align-items: center; transition: background 0.15s; width: 100%; box-sizing: border-box; }
        button.via-row { background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
        button.via-row:hover, button.via-row[aria-expanded="true"] { background: #f7f5f0; }
        .via-detail { padding: 4px 16px 18px 46px; display: flex; flex-direction: column; gap: 14px; }
        @media (max-width: 640px) {
          .via-row { grid-template-columns: 2fr 1fr 1fr 24px; }
          .via-col-length, .via-col-desc { display: none; }
          .via-detail { padding: 4px 8px 16px; }
        }
      `}</style>
      <div className="via-row" style={{ borderBottom: "1px solid #ede9e1", borderRadius: 0, paddingTop: 0 }}>
        <p style={head}>Nombre</p>
        <p style={head}>Grado</p>
        <p style={head}>Chapas</p>
        <p className="via-col-length" style={head}>Largo</p>
        <p className="via-col-desc" style={head}>Descripción</p>
        <span />
      </div>
      {vias.map((v, i) => {
        const open = openId === v.id
        return (
          <Fragment key={v.id}>
            <button
              type="button"
              className="via-row"
              aria-expanded={open}
              aria-controls={`via-${v.id}`}
              onClick={() => setOpenId(open ? null : v.id)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "#d0cdc7", fontFamily: "monospace", width: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1b19" }}>{v.name}</span>
                {v.photos.length > 0 && <span aria-label={`${v.photos.length} fotos`} style={{ fontSize: 12 }}>📷</span>}
              </span>
              <span>{v.grade ? <Pill variant={gradeVariant(v.grade)}>{v.grade}</Pill> : <span style={{ color: "var(--muted)" }}>—</span>}</span>
              <span style={{ fontSize: 14, color: "#3d3d3a" }}>{v.bolts ?? "—"}</span>
              <span className="via-col-length" style={{ fontSize: 14, color: "#3d3d3a" }}>{v.length ? `${v.length} m` : "—"}</span>
              <span className="via-col-desc" style={{ fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.description || "—"}
              </span>
              <span aria-hidden="true" style={{ color: "var(--muted)", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </button>
            {open && (
              <div id={`via-${v.id}`} className="via-detail">
                {v.description?.trim() && (
                  <p style={{ fontSize: 14, color: "#2c2c2a", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{v.description.trim()}</p>
                )}
                <ItemPhotos
                  photos={v.photos}
                  slots={v.photo_slots}
                  target="climbing_route"
                  targetId={v.id}
                  spotId={spotId}
                  name={v.name}
                  emptyText="Esta vía todavía no tiene fotos. ¿La escalaste? Sumá las tuyas."
                />
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
