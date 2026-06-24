"use client"

import type { MotorhomeDetailItem } from "../types"
import { s } from "../styles"
import Field from "../ui/Field"
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
  function upd(field: keyof MotorhomeDetailItem, val: string | boolean) {
    setMotorhomeDetail({ ...motorhomeDetail, [field]: val })
  }

  return (
    <div style={s.card}>
      <h2 style={s.title}>Datos del espacio para motorhomes</h2>
      <p style={s.subtitle}>Contanos las características de este lugar.</p>

      <div style={s.form}>
        <Field label="Capacidad (cantidad de motorhomes)" required={false}>
          <input
            type="number" value={motorhomeDetail.capacity}
            onChange={e => upd("capacity", e.target.value)}
            style={s.input}
          />
        </Field>
        <Field label="Tipo de superficie" required={false}>
          <select
            value={motorhomeDetail.surface_type}
            onChange={e => upd("surface_type", e.target.value)}
            style={s.input}
          >
            <option value="">Seleccioná...</option>
            <option value="cesped">Césped</option>
            <option value="ripio">Ripio</option>
            <option value="asfalto">Asfalto</option>
            <option value="tierra">Tierra</option>
          </select>
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={motorhomeDetail.has_water} onChange={e => upd("has_water", e.target.checked)} />
          Tiene agua
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={motorhomeDetail.has_electricity} onChange={e => upd("has_electricity", e.target.checked)} />
          Tiene electricidad
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={motorhomeDetail.has_dump_station} onChange={e => upd("has_dump_station", e.target.checked)} />
          Tiene dump station
        </label>
        <Field label="Noches máximas permitidas" required={false}>
          <input
            type="number" value={motorhomeDetail.max_stay_nights}
            onChange={e => upd("max_stay_nights", e.target.value)}
            style={s.input}
          />
        </Field>
      </div>

      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
