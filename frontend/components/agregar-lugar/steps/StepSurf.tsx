"use client"

// Lo propio de una escuela de surf. El nombre, la descripción, el precio, la
// temporada, el contacto, dónde opera y el mapa van en "Información básica",
// y las fotos en su paso, como cualquier lugar. Todo opcional.
import type React from "react"
import { s, sanitizeNum } from "../styles"
import Field from "../ui/Field"
import TriStateToggle from "../ui/TriStateToggle"
import NavRow from "../ui/NavRow"
import type { SurfItem } from "../types"
import MultiChoiceUnknown from "@/components/ui/MultiChoiceUnknown"
import { LANGUAGES, SURF_LEVELS } from "@/lib/operatorInfo"

// Los campos, también para el panel del dueño (EditForms).
export function SurfFields({ surf, setSurf }: {
  surf: SurfItem
  setSurf: React.Dispatch<React.SetStateAction<SurfItem>>
}) {
  return (
    <div style={s.form}>
      <div className="form-two-col">
        <Field label="Tipo de clase" required={false}>
          <select style={s.input} value={surf.class_type} onChange={e => setSurf(p => ({ ...p, class_type: e.target.value }))}>
            <option value="">-</option>
            <option value="grupal">Grupal</option>
            <option value="privada">Privada</option>
            <option value="intensivo">Intensivo</option>
          </select>
        </Field>
        <Field label="Duración de la clase (horas)" required={false}>
          <input style={s.input} type="number" step="any" min={0} value={surf.duration} onChange={e => setSurf(p => ({ ...p, duration: sanitizeNum(e.target.value) }))} />
        </Field>
      </div>
      <Field label="¿El precio es por…?" required={false} sublabel="Por ejemplo: por clase, por hora">
        <input style={s.input} type="text" maxLength={60} placeholder="por clase" value={surf.price_note} onChange={e => setSurf(p => ({ ...p, price_note: e.target.value }))} />
      </Field>
      <Field label="¿Incluye el equipo?" required={false}>
        <TriStateToggle value={surf.equipment_include} onChange={v => setSurf(p => ({ ...p, equipment_include: v }))} />
      </Field>
      <Field label="¿Para qué niveles?" required={false}>
        <MultiChoiceUnknown label="Niveles" options={SURF_LEVELS} value={surf.levels} onChange={v => setSurf(p => ({ ...p, levels: v }))} />
      </Field>
      <Field label="¿En qué idiomas dan las clases?" required={false}>
        <MultiChoiceUnknown label="Idiomas" options={LANGUAGES} value={surf.languages} onChange={v => setSurf(p => ({ ...p, languages: v }))} />
      </Field>
    </div>
  )
}

export default function StepSurf({ surf, setSurf, error, onBack, onNext }: {
  surf: SurfItem
  setSurf: React.Dispatch<React.SetStateAction<SurfItem>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 style={s.title}>Datos de la escuela de surf</h2>
      <div style={s.card}>
        <SurfFields surf={surf} setSurf={setSurf} />
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
