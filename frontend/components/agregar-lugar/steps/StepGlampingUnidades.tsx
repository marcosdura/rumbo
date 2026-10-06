"use client"

import { useState } from "react"
import type { GlampingDetailItem } from "../types"
import { defaultGlampingDetail } from "../constants"
import { s } from "../styles"
import { errorInputBorder, errorHintText, sanitizeNum } from "../styles"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import { missingGlampingFields } from "../payloads"

interface Props {
  glampingUnits: GlampingDetailItem[]
  setGlampingUnits: (v: GlampingDetailItem[]) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}

export default function StepGlampingUnidades({
  glampingUnits, setGlampingUnits, error, onBack, onNext,
}: Props) {
  const [unitErrors, setUnitErrors] = useState<Record<number, Set<string>>>({})

  function updUnit(index: number, field: keyof GlampingDetailItem, val: string) {
    const next = [...glampingUnits]
    next[index] = { ...next[index], [field]: val }
    setGlampingUnits(next)
    setUnitErrors(prev => {
      const unitSet = new Set(prev[index] ?? [])
      unitSet.delete(field as string)
      return { ...prev, [index]: unitSet }
    })
  }

  function addUnit() {
    setGlampingUnits([...glampingUnits, defaultGlampingDetail()])
  }

  function removeUnit(index: number) {
    setGlampingUnits(glampingUnits.filter((_, i) => i !== index))
    setUnitErrors(prev => {
      const next: Record<number, Set<string>> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k)
        if (i < index) next[i] = v
        else if (i > index) next[i - 1] = v
      })
      return next
    })
  }

  function validate(): boolean {
    if (glampingUnits.length === 0) return false
    const allErrors: Record<number, Set<string>> = {}
    let ok = true
    glampingUnits.forEach((unit, i) => {
      const missing = missingGlampingFields(unit) as Set<string>
      if (missing.size > 0) { allErrors[i] = missing; ok = false }
    })
    setUnitErrors(allErrors)
    return ok
  }

  function handleNext() {
    if (!validate()) return
    onNext()
  }

  return (
    <div>
      <h2 style={s.title}>Tipos de alojamiento</h2>
      <p style={s.subtitle}>
        Contanos qué tipos de cabañas, domos o carpas ofrece este lugar. Si tenés varios tamaños o categorías, agregá uno por cada tipo.
      </p>

      {glampingUnits.map((unit, index) => {
        const errors = unitErrors[index] ?? new Set<string>()
        return (
          <GlampingUnitCard
            key={index}
            index={index}
            unit={unit}
            errors={errors}
            onChange={(field, val) => updUnit(index, field, val)}
            onRemove={glampingUnits.length > 1 ? () => removeUnit(index) : undefined}
          />
        )
      })}

      <button style={s.btnAdd} onClick={addUnit}>+ Agregar otro tipo de alojamiento</button>

      {glampingUnits.length === 0 && (
        <p style={errorHintText}>Agregá al menos un tipo de alojamiento.</p>
      )}

      <NavRow onBack={onBack} onNext={handleNext} error={error} />
    </div>
  )
}

// Una unidad de glamping (tipo, capacidad, precio, mínimo de noches).
// Exportada: el dashboard del dueño la reusa para sumar unidades a un
// lugar existente.
export function GlampingUnitCard({ index, unit, errors, onChange, onRemove }: {
  index: number
  unit: GlampingDetailItem
  errors: Set<string>
  onChange: (field: keyof GlampingDetailItem, val: string) => void
  onRemove?: () => void
}) {
  return (
    <div style={{ ...s.card, position: "relative" }}>
      {onRemove && (
        <button onClick={onRemove} style={s.deleteBtn} aria-label="Quitar">✕</button>
      )}
      <p style={s.cardTitle}>Tipo {index + 1}</p>
      <div style={s.form}>
        <Field label="Tipo de alojamiento" required={true} hasError={errors.has("accommodation_type")} errorText="Seleccioná un tipo de alojamiento">
          <select
            style={{ ...s.input, ...(errors.has("accommodation_type") ? errorInputBorder : {}) }}
            value={unit.accommodation_type}
            onChange={e => onChange("accommodation_type", e.target.value)}
          >
            <option value="">Seleccioná...</option>
            <option value="domo">Domo</option>
            <option value="carpa">Carpa equipada</option>
            <option value="cabaña">Cabaña</option>
            <option value="treehouse">Treehouse</option>
            <option value="otro">Otro</option>
          </select>
        </Field>
        <Field label="Capacidad (personas)" required={true} hasError={errors.has("capacity")} errorText="Completá la capacidad">
          <input
            style={{ ...s.input, ...(errors.has("capacity") ? errorInputBorder : {}) }}
            type="number" min={0} value={unit.capacity}
            onChange={e => onChange("capacity", sanitizeNum(e.target.value))}
          />
        </Field>
        <Field label="Precio por noche" required={true} hasError={errors.has("price_per_night")} errorText="Completá el precio por noche">
          <input
            style={{ ...s.input, ...(errors.has("price_per_night") ? errorInputBorder : {}) }}
            type="number" min={0} value={unit.price_per_night}
            onChange={e => onChange("price_per_night", sanitizeNum(e.target.value))}
          />
        </Field>
        <Field
          label="Mínimo de noches" required={true} sublabel="Si no tiene mínimo, poné 0"
          hasError={errors.has("min_nights")} errorText="Completá el mínimo de noches (poné 0 si no hay mínimo)"
        >
          <input
            style={{ ...s.input, ...(errors.has("min_nights") ? errorInputBorder : {}) }}
            type="number" min={0} value={unit.min_nights}
            onChange={e => onChange("min_nights", sanitizeNum(e.target.value))}
          />
        </Field>
      </div>
    </div>
  )
}
