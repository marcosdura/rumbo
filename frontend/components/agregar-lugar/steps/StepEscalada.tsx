"use client"

import { useState } from "react"
import type React from "react"
import { defaultSector } from "../constants"
import { s, errorInputBorder, sanitizeNum } from "../styles"
import { unnamedRows } from "../validation"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import SectorExtraFields from "../ui/SectorExtraFields"
import type { SectorItem } from "../types"

export default function StepEscalada({
  sectors, setSectors, error, onBack, onNext,
}: {
  sectors: SectorItem[]
  setSectors: React.Dispatch<React.SetStateAction<SectorItem[]>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const [nameErrors, setNameErrors] = useState<Set<number>>(new Set())

  function updSector(i: number, field: string, val: string) {
    setSectors(prev => prev.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec))
    if (field === "name") setNameErrors(prev => { const n = new Set(prev); n.delete(i); return n })
  }

  function removeSector(i: number) {
    setSectors(prev => prev.filter((_, idx) => idx !== i))
    setNameErrors(new Set())
  }

  // Un sector con datos y sin nombre no se puede guardar (antes se
  // descartaba en silencio, y con él sus vías).
  function handleNext() {
    const unnamed = unnamedRows(sectors)
    setNameErrors(new Set(unnamed))
    if (unnamed.length === 0) onNext()
  }

  return (
    <div>
      <h2 style={s.title}>Datos de Escalada</h2>
      {sectors.map((sec, i) => (
        <div key={i} style={{ ...s.card, position: "relative" }}>
          {sectors.length > 1 && (
            <button onClick={() => removeSector(i)} style={s.deleteBtn}>✕</button>
          )}
          <p style={s.cardTitle}>Sector {i + 1}</p>
          <div style={s.form}>
            <Field label="Nombre" required={true} hasError={nameErrors.has(i)} errorText="El nombre del sector es obligatorio">
              <input
                aria-label={`Nombre del sector ${i + 1}`}
                style={{ ...s.input, ...(nameErrors.has(i) ? errorInputBorder : {}) }}
                value={sec.name} onChange={e => updSector(i, "name", e.target.value)}
              />
            </Field>
            <div className="form-two-col">
              <Field label="Tipo" required={false}>
                <select style={s.input} value={sec.type} onChange={e => updSector(i, "type", e.target.value)}>
                  <option value="">-</option>
                  <option value="boulder">Boulder</option>
                  <option value="deportiva">Deportiva</option>
                  <option value="tradicional">Tradicional</option>
                </select>
              </Field>
              <Field label="Altitud máxima (m)" required={false}>
                <input style={s.input} type="number" min={0} value={sec.max_altitude} onChange={e => updSector(i, "max_altitude", sanitizeNum(e.target.value))} />
              </Field>
            </div>
            <SectorExtraFields sector={sec} upd={(f, v) => updSector(i, f, v)} n={i + 1} />
            <Field label="Restricciones" required={false}>
              <input style={s.input} value={sec.restrictions} onChange={e => updSector(i, "restrictions", e.target.value)} />
            </Field>
          </div>
        </div>
      ))}
      <button style={s.btnAdd} onClick={() => setSectors(prev => [...prev, defaultSector()])}>+ Agregar sector</button>
      <NavRow onBack={onBack} onNext={handleNext} error={error ?? (nameErrors.size > 0 ? "Completá el nombre de cada sector." : null)} />
    </div>
  )
}
