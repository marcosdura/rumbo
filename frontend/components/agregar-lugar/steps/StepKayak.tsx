"use client"

// Lo propio de un servicio de kayak (como StepSurf): el resto va en
// "Información básica" y en las fotos, como cualquier lugar. Todo opcional.
import type React from "react"
import { s, sanitizeNum } from "../styles"
import Field from "../ui/Field"
import TriStateToggle from "../ui/TriStateToggle"
import NavRow from "../ui/NavRow"
import type { KayakItem } from "../types"

export default function StepKayak({ kayak, setKayak, error, onBack, onNext }: {
  kayak: KayakItem
  setKayak: React.Dispatch<React.SetStateAction<KayakItem>>
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  const upd = <K extends keyof KayakItem>(field: K, value: KayakItem[K]) => setKayak(p => ({ ...p, [field]: value }))
  return (
    <div>
      <h2 style={s.title}>Datos del servicio de kayak</h2>
      <div style={s.card}>
        <div style={s.form}>
          <div className="form-two-col">
            <Field label="Tipo de agua" required={false}>
              <select style={s.input} value={kayak.water_type} onChange={e => upd("water_type", e.target.value)}>
                <option value="">-</option>
                <option value="rio">Río</option>
                <option value="lago">Lago</option>
                <option value="mar">Mar</option>
              </select>
            </Field>
            <Field label="Dificultad" required={false}>
              <select style={s.input} value={kayak.difficulty} onChange={e => upd("difficulty", e.target.value)}>
                <option value="">-</option>
                <option value="facil">Fácil</option>
                <option value="intermedio">Intermedio</option>
                <option value="dificil">Difícil</option>
              </select>
            </Field>
          </div>
          <div className="form-two-col">
            <Field label="Duración de la salida (horas)" required={false}>
              <input style={s.input} type="number" step="any" min={0} value={kayak.duration} onChange={e => upd("duration", sanitizeNum(e.target.value))} />
            </Field>
            <Field label="Tipo de kayak" required={false}>
              <select style={s.input} value={kayak.kayak_type} onChange={e => upd("kayak_type", e.target.value)}>
                <option value="">-</option>
                <option value="travesia">Travesía</option>
                <option value="recreativo">Recreativo</option>
                <option value="rapido">Rápido</option>
              </select>
            </Field>
          </div>
          <Field label="¿El precio es por…?" required={false} sublabel="Por ejemplo: por hora, por salida">
            <input style={s.input} type="text" maxLength={60} placeholder="por hora" value={kayak.price_note} onChange={e => upd("price_note", e.target.value)} />
          </Field>
          <Field label="¿Alquilás kayaks?" required={false}>
            <TriStateToggle value={kayak.rental_available} onChange={v => upd("rental_available", v)} />
          </Field>
          <Field label="¿Incluye guía?" required={false}>
            <TriStateToggle value={kayak.includes_guide} onChange={v => upd("includes_guide", v)} />
          </Field>
          <Field label="¿Incluye chaleco salvavidas?" required={false}>
            <TriStateToggle value={kayak.includes_life_jacket} onChange={v => upd("includes_life_jacket", v)} />
          </Field>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} error={error} />
    </div>
  )
}
