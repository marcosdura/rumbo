"use client"

import type React from "react"
import { defaultRoute } from "../constants"
import { s } from "../styles"
import Field from "../ui/Field"
import NavRow from "../ui/NavRow"
import type { RouteItem } from "../types"

export default function StepRutas({
  routes, setRoutes, onBack, onNext, stepLabel,
}: {
  routes: RouteItem[]
  setRoutes: React.Dispatch<React.SetStateAction<RouteItem[]>>
  onBack: () => void
  onNext: () => void
  stepLabel?: string
}) {
  function updRoute(i: number, field: string, val: string) {
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  return (
    <div>
      <NavRow onBack={onBack} onNext={onNext} error={null} stepLabel={stepLabel} />
      <h2 style={s.title}>Rutas</h2>
      {routes.map((r, i) => (
        <div key={i} style={s.card}>
          <p style={s.cardTitle}>Ruta {i + 1}</p>
          <div style={s.form}>
            <Field label="Nombre" required={true}>
              <input style={s.input} value={r.name} onChange={e => updRoute(i, "name", e.target.value)} />
            </Field>
            <div className="form-two-col">
              <Field label="Distancia (km)" required={false}><input style={s.input} type="number" step="any" value={r.distance_km} onChange={e => updRoute(i, "distance_km", e.target.value)} /></Field>
              <Field label="Duración (horas)" required={false}><input style={s.input} type="number" step="any" value={r.duration_hours} onChange={e => updRoute(i, "duration_hours", e.target.value)} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Desnivel positivo (m)" required={false}><input style={s.input} type="number" value={r.elevation_gain} onChange={e => updRoute(i, "elevation_gain", e.target.value)} /></Field>
              <Field label="Desnivel negativo (m)" required={false}><input style={s.input} type="number" value={r.elevation_loss} onChange={e => updRoute(i, "elevation_loss", e.target.value)} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Altitud máxima (m)" required={false}><input style={s.input} type="number" value={r.max_altitude} onChange={e => updRoute(i, "max_altitude", e.target.value)} /></Field>
              <Field label="Altitud mínima (m)" required={false}><input style={s.input} type="number" value={r.min_altitude} onChange={e => updRoute(i, "min_altitude", e.target.value)} /></Field>
            </div>
            <div className="form-two-col">
              <Field label="Dificultad" required={false}>
                <select style={s.input} value={r.difficulty} onChange={e => updRoute(i, "difficulty", e.target.value)}>
                  <option value="">-</option>
                  <option value="fácil">Fácil</option>
                  <option value="moderado">Moderado</option>
                  <option value="difícil">Difícil</option>
                </select>
              </Field>
              <Field label="Tipo de ruta" required={false}>
                <select style={s.input} value={r.route_type} onChange={e => updRoute(i, "route_type", e.target.value)}>
                  <option value="">-</option>
                  <option value="circular">Circular</option>
                  <option value="ida y vuelta">Ida y vuelta</option>
                </select>
              </Field>
            </div>
            <div className="form-two-col">
              <Field label="Nivel técnico" required={false}>
                <select style={s.input} value={r.technical_level} onChange={e => updRoute(i, "technical_level", e.target.value)}>
                  <option value="">-</option>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </Field>
              <Field label="Demanda física" required={false}>
                <select style={s.input} value={r.physical_demand} onChange={e => updRoute(i, "physical_demand", e.target.value)}>
                  <option value="">-</option>
                  <option value="bajo">Baja</option>
                  <option value="medio">Media</option>
                  <option value="alto">Alta</option>
                </select>
              </Field>
            </div>
          </div>
        </div>
      ))}
      <button style={s.btnAdd} onClick={() => setRoutes(prev => [...prev, defaultRoute()])}>+ Agregar ruta</button>
      <NavRow onBack={onBack} onNext={onNext} stepLabel={stepLabel} />
    </div>
  )
}
