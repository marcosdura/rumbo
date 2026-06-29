"use client"

import { useState } from "react"
import type { MotorhomeDetailItem } from "../types"
import { s, errorInputBorder, sanitizeNum } from "../styles"
import Field from "../ui/Field"
import BinaryToggle from "../ui/BinaryToggle"
import NavRow from "../ui/NavRow"

interface Props {
  motorhomeDetail: MotorhomeDetailItem
  setMotorhomeDetail: (v: MotorhomeDetailItem) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}

export default function StepMotorhomeDetalle({
  motorhomeDetail, setMotorhomeDetail, error, onBack, onNext,
}: Props) {
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set())

  function upd(field: keyof MotorhomeDetailItem, val: string | boolean | null) {
    setMotorhomeDetail({ ...motorhomeDetail, [field]: val })
    setFieldErrors(prev => { const n = new Set(prev); n.delete(field as string); return n })
  }

  function validate(): boolean {
    const missing = new Set<string>()
    if (!motorhomeDetail.capacity) missing.add("capacity")
    if (!motorhomeDetail.surface_type) missing.add("surface_type")
    if (motorhomeDetail.has_water === null) missing.add("has_water")
    if (motorhomeDetail.has_electricity === null) missing.add("has_electricity")
    if (motorhomeDetail.has_dump_station === null) missing.add("has_dump_station")
    setFieldErrors(missing)
    return missing.size === 0
  }

  function handleNext() {
    if (!validate()) return
    onNext()
  }

  return (
    <div style={s.card}>
      <h2 style={s.title}>Datos del espacio para motorhomes</h2>
      <p style={s.subtitle}>Contanos las características de este lugar.</p>

      <div style={s.form}>
        <Field label="Capacidad (cantidad de motorhomes)" required={true} hasError={fieldErrors.has("capacity")} errorText="Completá la capacidad">
          <input
            type="number" min={0} value={motorhomeDetail.capacity}
            onChange={e => upd("capacity", sanitizeNum(e.target.value))}
            style={{ ...s.input, ...(fieldErrors.has("capacity") ? errorInputBorder : {}) }}
          />
        </Field>
        <Field label="Tipo de superficie" required={true} hasError={fieldErrors.has("surface_type")} errorText="Seleccioná un tipo de superficie">
          <select
            value={motorhomeDetail.surface_type}
            onChange={e => upd("surface_type", e.target.value)}
            style={{ ...s.input, ...(fieldErrors.has("surface_type") ? errorInputBorder : {}) }}
          >
            <option value="">Seleccioná...</option>
            <option value="cesped">Césped</option>
            <option value="ripio">Ripio</option>
            <option value="asfalto">Asfalto</option>
            <option value="tierra">Tierra</option>
          </select>
        </Field>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, color: fieldErrors.has("has_water") ? "#e53e3e" : "#1b1b19" }}>
            ¿Tiene agua? <span style={{ color: "#e53e3e", fontSize: 12 }}>*</span>
          </span>
          <BinaryToggle value={motorhomeDetail.has_water} onChange={v => upd("has_water", v)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, color: fieldErrors.has("has_electricity") ? "#e53e3e" : "#1b1b19" }}>
            ¿Tiene electricidad? <span style={{ color: "#e53e3e", fontSize: 12 }}>*</span>
          </span>
          <BinaryToggle value={motorhomeDetail.has_electricity} onChange={v => upd("has_electricity", v)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, color: fieldErrors.has("has_dump_station") ? "#e53e3e" : "#1b1b19" }}>
            ¿Tiene dump station? <span style={{ color: "#e53e3e", fontSize: 12 }}>*</span>
          </span>
          <BinaryToggle value={motorhomeDetail.has_dump_station} onChange={v => upd("has_dump_station", v)} />
        </div>

        <Field label="Noches máximas permitidas" required={false}>
          <input
            type="number" min={0} value={motorhomeDetail.max_stay_nights}
            onChange={e => upd("max_stay_nights", sanitizeNum(e.target.value))}
            style={s.input}
          />
        </Field>
      </div>

      <NavRow onBack={onBack} onNext={handleNext} error={error ?? (fieldErrors.size > 0 ? "Completá los campos marcados en rojo." : null)} />
    </div>
  )
}
