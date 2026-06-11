"use client"

import type React from "react"
import { s } from "../styles"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import type { SectorItem } from "../types"

export default function StepClimbingSectorForm({
  sectors, setSectors, error, onBack, onNext,
}: {
  sectors: SectorItem[]
  setSectors: React.Dispatch<React.SetStateAction<SectorItem[]>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const sec = sectors[0]
  function upd(field: string, val: string) {
    setSectors(prev => [{ ...prev[0], [field]: val }, ...prev.slice(1)])
  }

  return (
    <div>
      <h2 style={s.title}>Datos del sector</h2>
      <div style={s.card}>
        <div style={s.form}>
          <Field label="Nombre" required={true}>
            <input style={s.input} value={sec.name} onChange={e => upd("name", e.target.value)} />
          </Field>
          <div className="form-two-col">
            <Field label="Tipo" required={false}>
              <select style={s.input} value={sec.type} onChange={e => upd("type", e.target.value)}>
                <option value="">-</option>
                <option value="boulder">Boulder</option>
                <option value="deportiva">Deportiva</option>
                <option value="tradicional">Tradicional</option>
              </select>
            </Field>
            <Field label="Altitud máxima (m)" required={false}>
              <input style={s.input} type="number" value={sec.max_altitude} onChange={e => upd("max_altitude", e.target.value)} />
            </Field>
          </div>
          <Field label="Restricciones" required={false}>
            <input style={s.input} value={sec.restrictions} onChange={e => upd("restrictions", e.target.value)} />
          </Field>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
