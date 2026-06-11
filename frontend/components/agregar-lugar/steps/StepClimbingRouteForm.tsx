"use client"

import type React from "react"
import { s } from "../styles"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import type { ClimbingRouteForm } from "../types"

export default function StepClimbingRouteForm({
  route, setRoute, error, onBack, onNext,
}: {
  route: ClimbingRouteForm
  setRoute: React.Dispatch<React.SetStateAction<ClimbingRouteForm>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  function upd(field: string, val: string) {
    setRoute(prev => ({ ...prev, [field]: val }))
  }

  return (
    <div>
      <h2 style={s.title}>Datos de la ruta</h2>
      <div style={s.card}>
        <div style={s.form}>
          <Field label="Nombre" required={true}>
            <input style={s.input} value={route.name} onChange={e => upd("name", e.target.value)} />
          </Field>
          <div className="form-two-col">
            <Field label="Grado (ej: 6a, 7b+)" required={false}>
              <input style={s.input} value={route.grade} onChange={e => upd("grade", e.target.value)} />
            </Field>
            <Field label="Tipo" required={false}>
              <select style={s.input} value={route.type} onChange={e => upd("type", e.target.value)}>
                <option value="">-</option>
                <option value="boulder">Boulder</option>
                <option value="deportiva">Deportiva</option>
                <option value="tradicional">Tradicional</option>
              </select>
            </Field>
          </div>
          <div className="form-two-col">
            <Field label="Largo (metros)" required={false}>
              <input style={s.input} type="number" value={route.length_m} onChange={e => upd("length_m", e.target.value)} />
            </Field>
            <Field label="Cantidad de chapas" required={false}>
              <input style={s.input} type="number" value={route.bolts} onChange={e => upd("bolts", e.target.value)} />
            </Field>
          </div>
          <Field label="Descripción" required={false}>
            <input style={s.input} value={route.description} onChange={e => upd("description", e.target.value)} />
          </Field>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
