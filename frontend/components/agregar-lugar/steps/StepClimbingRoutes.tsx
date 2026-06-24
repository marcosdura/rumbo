"use client"

import { useState } from "react"
import type React from "react"
import { s, errorInputBorder } from "../styles"
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
  const [routeErrors, setRouteErrors] = useState<Record<number, Set<string>>>({})

  function upd(i: number, field: keyof ClimbingRouteItem, val: string | number) {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
    setRouteErrors(prev => {
      const errs = new Set(prev[i] ?? [])
      errs.delete(field as string)
      return { ...prev, [i]: errs }
    })
  }

  function addRoute() {
    setRoutes(prev => [...prev, defaultClimbingRouteItem(showSectorPicker ? -1 : 0)])
  }

  function removeRoute(i: number) {
    setRoutes(prev => prev.filter((_, idx) => idx !== i))
    setRouteErrors(prev => {
      const next: Record<number, Set<string>> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k)
        if (idx < i) next[idx] = v
        else if (idx > i) next[idx - 1] = v
      })
      return next
    })
  }

  function validate(): boolean {
    const allErrors: Record<number, Set<string>> = {}
    let ok = true
    routes.forEach((r, i) => {
      const missing = new Set<string>()
      if (!r.name.trim()) missing.add("name")
      if (showSectorPicker && r.sectorIndex === -1) missing.add("sectorIndex")
      if (missing.size > 0) { allErrors[i] = missing; ok = false }
    })
    setRouteErrors(allErrors)
    return ok
  }

  function handleNext() {
    if (!validate()) return
    onNext()
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
              <Field label="Sector" required={true} hasError={(routeErrors[i] ?? new Set()).has("sectorIndex")} errorText="Seleccioná un sector">
                <select
                  style={{ ...s.input, ...((routeErrors[i] ?? new Set()).has("sectorIndex") ? errorInputBorder : {}) }}
                  value={r.sectorIndex}
                  onChange={e => upd(i, "sectorIndex", Number(e.target.value))}
                >
                  <option value={-1} disabled>Seleccioná un sector...</option>
                  {sectors.map((sec, idx) => (
                    <option key={idx} value={idx}>{sec.name || `Sector ${idx + 1}`}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Nombre" required={true} hasError={(routeErrors[i] ?? new Set()).has("name")} errorText="El nombre de la ruta es obligatorio">
              <input
                style={{ ...s.input, ...((routeErrors[i] ?? new Set()).has("name") ? errorInputBorder : {}) }}
                value={r.name} onChange={e => upd(i, "name", e.target.value)}
              />
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
      <NavRow onBack={onBack} onNext={handleNext} error={error ?? (Object.keys(routeErrors).length > 0 ? "Completá los campos marcados en rojo." : null)} />
    </div>
  )
}
