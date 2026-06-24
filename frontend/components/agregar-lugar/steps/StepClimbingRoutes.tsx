"use client"

import type React from "react"
import { s } from "../styles"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import type { SectorItem, ClimbingRouteItem } from "../types"
import { defaultClimbingRouteItem } from "../constants"

export default function StepClimbingRoutes({
  sectors, routes, setRoutes, error, onBack, onNext,
}: {
  sectors: SectorItem[]
  routes: ClimbingRouteItem[]
  setRoutes: React.Dispatch<React.SetStateAction<ClimbingRouteItem[]>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const showSectorPicker = sectors.length > 1

  function upd(i: number, field: keyof ClimbingRouteItem, val: string | number) {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  function addRoute() {
    setRoutes(prev => [...prev, defaultClimbingRouteItem(0)])
  }

  function removeRoute(i: number) {
    setRoutes(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <h2 style={s.title}>Rutas (opcional)</h2>
      <p style={s.subtitle}>
        Si conocés rutas de {sectors.length > 1 ? "estos sectores" : "este sector"}, podés agregarlas ahora. Podés omitir este paso.
      </p>

      {routes.map((r, i) => (
        <div key={i} style={{ ...s.card, position: "relative" }}>
          <button onClick={() => removeRoute(i)} style={s.deleteBtn}>✕</button>
          <p style={s.cardTitle}>Ruta {i + 1}</p>
          <div style={s.form}>
            {showSectorPicker && (
              <Field label="Sector" required={false}>
                <select
                  style={s.input}
                  value={r.sectorIndex}
                  onChange={e => upd(i, "sectorIndex", Number(e.target.value))}
                >
                  {sectors.map((sec, idx) => (
                    <option key={idx} value={idx}>{sec.name || `Sector ${idx + 1}`}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Nombre" required={false}>
              <input style={s.input} value={r.name} onChange={e => upd(i, "name", e.target.value)} />
            </Field>
            <div className="form-two-col">
              <Field label="Grado (ej: 6a, 7b+)" required={false}>
                <input style={s.input} value={r.grade} onChange={e => upd(i, "grade", e.target.value)} />
              </Field>
              <Field label="Tipo" required={false}>
                <select style={s.input} value={r.type} onChange={e => upd(i, "type", e.target.value)}>
                  <option value="">-</option>
                  <option value="boulder">Boulder</option>
                  <option value="deportiva">Deportiva</option>
                  <option value="tradicional">Tradicional</option>
                </select>
              </Field>
            </div>
            <div className="form-two-col">
              <Field label="Largo (metros)" required={false}>
                <input style={s.input} type="number" value={r.length_m} onChange={e => upd(i, "length_m", e.target.value)} />
              </Field>
              <Field label="Cantidad de chapas" required={false}>
                <input style={s.input} type="number" value={r.bolts} onChange={e => upd(i, "bolts", e.target.value)} />
              </Field>
            </div>
            <Field label="Descripción" required={false}>
              <input style={s.input} value={r.description} onChange={e => upd(i, "description", e.target.value)} />
            </Field>
          </div>
        </div>
      ))}

      <button style={s.btnAdd} onClick={addRoute}>+ Agregar ruta</button>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
