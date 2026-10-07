"use client"

// Aproximación, sol o sombra y tipo de roca de un sector. Opcionales: el
// "No sé" queda a la vista (y se guarda como vacío).
import { s } from "../styles"
import Field from "./Field"
import { APPROACH_OPTIONS, ROCK_TYPES, SUN_EXPOSURE, approachLabel } from "@/lib/sectorInfo"
import type { SectorItem } from "../types"

export default function SectorExtraFields({ sector, upd, n }: {
  sector: SectorItem
  upd: (field: "approach_minutes" | "sun_exposure" | "rock_type", val: string) => void
  // Para distinguir los campos cuando hay varios sectores.
  n?: number
}) {
  const suffix = n ? ` del sector ${n}` : ""
  return (
    <>
      <div className="form-two-col">
        <Field label="Aproximación (caminata)" required={false}>
          <select aria-label={`Aproximación${suffix}`} style={s.input} value={sector.approach_minutes}
            onChange={e => upd("approach_minutes", e.target.value)}>
            <option value="">No sé</option>
            {APPROACH_OPTIONS.map(m => <option key={m} value={String(m)}>{approachLabel(m)}</option>)}
          </select>
        </Field>
        <Field label="¿Sol o sombra?" required={false}>
          <select aria-label={`Sol o sombra${suffix}`} style={s.input} value={sector.sun_exposure}
            onChange={e => upd("sun_exposure", e.target.value)}>
            <option value="">No sé</option>
            {Object.entries(SUN_EXPOSURE).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Tipo de roca" required={false}>
        <select aria-label={`Tipo de roca${suffix}`} style={s.input} value={sector.rock_type}
          onChange={e => upd("rock_type", e.target.value)}>
          <option value="">No sé</option>
          {Object.entries(ROCK_TYPES).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </Field>
    </>
  )
}
